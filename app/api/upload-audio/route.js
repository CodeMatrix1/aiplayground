import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { spawn } from "child_process";
import { existsSync } from "fs";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create task record
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        type: "CONVERSATION_ANALYSIS",
        status: "PROCESSING",
        input: audioFile.name,
        metadata: {
          fileSize: audioFile.size,
          fileType: audioFile.type,
        },
      },
    });

    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "uploads");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Save file
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${audioFile.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      // Update task with file path
      await prisma.task.update({
        where: { id: task.id },
        data: { input: filePath },
      });

      // Transcribe with Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: buffer,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      // Perform speaker diarization using pyannote.audio
      let diarization = [];
      try {
        diarization = await performDiarization(filePath);
      } catch (error) {
        console.error("Diarization failed:", error);
        // Continue without diarization
      }

      // Generate summary using OpenAI
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes conversations. Provide a concise summary of the key points discussed."
          },
          {
            role: "user",
            content: `Please summarize this conversation:\n\n${transcription.text}`
          }
        ],
        max_tokens: 300,
      });

      const summary = summaryResponse.choices[0].message.content;

      // Format diarization results
      const formattedDiarization = diarization.map(segment => ({
        speaker: segment.speaker,
        start: segment.start,
        end: segment.end,
        text: segment.text || ""
      }));

      const result = {
        transcription: transcription.text,
        diarization: formattedDiarization,
        summary: summary,
        metadata: {
          duration: transcription.duration,
          language: transcription.language,
          segments: transcription.segments?.length || 0,
        }
      };

      // Update task with results
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "COMPLETED",
          output: JSON.stringify(result),
          metadata: {
            ...task.metadata,
            duration: transcription.duration,
            language: transcription.language,
            segments: transcription.segments?.length || 0,
            speakers: diarization.length > 0 ? Math.max(...diarization.map(d => d.speaker)) + 1 : 1,
          },
        },
      });

      return NextResponse.json(result);

    } catch (error) {
      // Update task with error
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "FAILED",
          output: error.message,
        },
      });

      throw error;
    }

  } catch (error) {
    console.error("Audio processing error:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}

async function performDiarization(audioPath) {
  return new Promise((resolve, reject) => {
    // This would typically call a Python script with pyannote.audio
    // For now, we'll return a mock implementation
    // In production, you'd want to set up a proper diarization service
    
    const pythonProcess = spawn('python', [
      join(process.cwd(), 'scripts', 'diarization.py'),
      audioPath
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const diarization = JSON.parse(result);
          resolve(diarization);
        } catch (e) {
          reject(new Error('Failed to parse diarization result'));
        }
      } else {
        reject(new Error(`Diarization failed: ${error}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start diarization process: ${err.message}`));
    });
  });
}