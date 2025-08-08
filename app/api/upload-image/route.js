import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
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
    const imageFile = formData.get("image");

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Create task record
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        type: "IMAGE_ANALYSIS",
        status: "PROCESSING",
        input: imageFile.name,
        metadata: {
          fileSize: imageFile.size,
          fileType: imageFile.type,
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
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      // Update task with file path
      await prisma.task.update({
        where: { id: task.id },
        data: { input: filePath },
      });

      // Analyze image with OpenAI Vision
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide: 1. A detailed description, 2. List of objects detected, 3. Dominant colors, 4. Relevant tags. Format the response as JSON with keys: description, objects, colors, tags."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${buffer.toString('base64')}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      const analysisText = analysisResponse.choices[0].message.content;
      
      // Parse the JSON response
      let analysis;
      try {
        // Extract JSON from the response (in case it's wrapped in markdown)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: treat the entire response as description
          analysis = {
            description: analysisText,
            objects: [],
            colors: [],
            tags: []
          };
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        analysis = {
          description: analysisText,
          objects: [],
          colors: [],
          tags: []
        };
      }

      const result = {
        description: analysis.description || analysisText,
        objects: analysis.objects || [],
        colors: analysis.colors || [],
        tags: analysis.tags || [],
        metadata: {
          fileSize: imageFile.size,
          fileType: imageFile.type,
          dimensions: await getImageDimensions(buffer),
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
    console.error("Image processing error:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}

async function getImageDimensions(buffer) {
  // This is a simplified version - in production you might want to use a proper image library
  // For now, we'll return a placeholder
  return {
    width: "unknown",
    height: "unknown"
  };
}
