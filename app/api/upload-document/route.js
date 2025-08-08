import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { existsSync } from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log("Document upload API called");
    
    // Authenticate user
    const user = await requireAuth();
    console.log("User authenticated:", user.id);

    // Parse form data
    const formData = await request.formData();
    const documentFile = formData.get("document");
    console.log("Document file received:", documentFile?.name, documentFile?.type, documentFile?.size);

    if (!documentFile) {
      return NextResponse.json(
        { error: "No document file provided" },
        { status: 400 }
      );
    }

    // Create task record
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        type: "DOCUMENT_SUMMARIZATION",
        status: "PROCESSING",
        input: documentFile.name,
        metadata: {
          fileSize: documentFile.size,
          fileType: documentFile.type,
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
      const bytes = await documentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${documentFile.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      // Update task with file path
      await prisma.task.update({
        where: { id: task.id },
        data: { input: filePath },
      });

      // Extract text from document
      let text = "";
      let metadata = {};

      if (documentFile.type === "application/pdf") {
        const pdfData = await pdf(buffer);
        text = pdfData.text;
        metadata = {
          pages: pdfData.numpages,
          title: pdfData.info?.Title || null,
          author: pdfData.info?.Author || null,
          wordCount: text.split(/\s+/).length,
        };
      } else if (documentFile.name.endsWith('.docx') || documentFile.name.endsWith('.doc')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        metadata = {
          wordCount: text.split(/\s+/).length,
          title: null,
          author: null,
        };
      } else {
        throw new Error("Unsupported document format");
      }

      // Truncate text if too long for OpenAI
      const maxTokens = 8000; // Conservative limit
      const estimatedTokens = text.split(/\s+/).length * 1.3; // Rough estimation
      
      if (estimatedTokens > maxTokens) {
        text = text.split(/\s+/).slice(0, Math.floor(maxTokens / 1.3)).join(' ');
        metadata.truncated = true;
      }

      // Generate summary using OpenAI
      let summaryText;
      try {
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
                         {
               role: "system",
               content: "You are a helpful assistant that summarizes documents. You must respond with ONLY valid JSON. No other text, no markdown formatting, no explanations. The JSON must have this exact structure: {\"summary\": \"detailed summary text here\", \"keyPoints\": [\"key point 1\", \"key point 2\", \"key point 3\"], \"topics\": [\"topic 1\", \"topic 2\"]}. Ensure the JSON is properly formatted with double quotes around all keys and string values."
             },
            {
              role: "user",
              content: `Please analyze and summarize this document:\n\n${text}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });
        
        summaryText = summaryResponse.choices[0].message.content;
        console.log("OpenAI response:", summaryText);
      } catch (openaiError) {
        console.error("OpenAI API Error:", openaiError.message);
        
        // If quota exceeded, provide a basic summary
        if (openaiError.message.includes("quota") || openaiError.message.includes("429")) {
          const wordCount = text.split(/\s+/).length;
          summaryText = JSON.stringify({
            summary: `This document contains ${wordCount} words. Due to API quota limits, a detailed summary is not available. Please check your OpenAI billing to continue using this feature.`,
            keyPoints: ["Document processed successfully", "API quota exceeded"],
            topics: ["Document Analysis", "API Limits"]
          });
        } else {
          throw openaiError;
        }
            }
      
      // Check if the response is empty or invalid
      if (!summaryText || summaryText.trim() === "") {
        throw new Error("OpenAI returned an empty response");
      }
      
             // Parse the JSON response
       let analysis;
       console.log("Attempting to parse OpenAI response:", summaryText);
       
       try {
         // First, try to parse the entire response as JSON
         analysis = JSON.parse(summaryText);
         console.log("Successfully parsed JSON:", analysis);
       } catch (parseError) {
         console.log("Initial JSON parse failed:", parseError.message);
         try {
           // If that fails, try to extract JSON from the response (in case it's wrapped in markdown)
           const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
           if (jsonMatch) {
             console.log("Found JSON match:", jsonMatch[0]);
             analysis = JSON.parse(jsonMatch[0]);
           } else {
             console.log("No JSON pattern found, using fallback");
             // Fallback: treat the entire response as summary
             analysis = {
               summary: summaryText,
               keyPoints: [],
               topics: []
             };
           }
         } catch (secondParseError) {
           console.log("Second JSON parse failed:", secondParseError.message);
           // Final fallback if JSON parsing fails
           console.log("Using final fallback for response:", summaryText);
           analysis = {
             summary: summaryText,
             keyPoints: [],
             topics: []
           };
         }
       }

      const result = {
        summary: analysis.summary || summaryText,
        keyPoints: analysis.keyPoints || [],
        topics: analysis.topics || [],
        metadata: {
          ...metadata,
          fileSize: documentFile.size,
          fileType: documentFile.type,
          originalWordCount: text.split(/\s+/).length,
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
            ...result.metadata,
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
    console.error("Document processing error:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Failed to process document: ${error.message}` },
      { status: 500 }
    );
  }
}
