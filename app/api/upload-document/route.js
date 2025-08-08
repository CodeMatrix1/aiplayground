import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { existsSync } from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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

             // Generate summary using Gemini
       let summaryText;
       try {
         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
         
                                       const prompt = `You are a helpful assistant that summarizes documents. You must respond with ONLY valid JSON. No other text, no markdown formatting, no explanations, no code blocks, no prefixes, no suffixes.

The JSON must have this exact structure:
{
  "summary": "detailed summary text here",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic 1", "topic 2"]
}

CRITICAL: Start your response with { and end with }. Do not include any text before the opening brace or after the closing brace. Ensure all strings use double quotes.

Please analyze and summarize this document:

${text}`;

         const result = await model.generateContent(prompt);
         const response = await result.response;
         summaryText = response.text();
         
         // Safety check for empty or undefined response
         if (!summaryText || summaryText.trim() === "") {
           throw new Error("Gemini returned an empty response");
         }
         
         console.log("Gemini response:", summaryText);
       } catch (geminiError) {
         console.error("Gemini API Error:", geminiError.message);
         
         // If quota exceeded or other error, provide a basic summary
         if (geminiError.message.includes("quota") || geminiError.message.includes("429") || geminiError.message.includes("rate")) {
           const wordCount = text.split(/\s+/).length;
           summaryText = JSON.stringify({
             summary: `This document contains ${wordCount} words. Due to API quota limits, a detailed summary is not available. Please check your Google AI Studio billing to continue using this feature.`,
             keyPoints: ["Document processed successfully", "API quota exceeded"],
             topics: ["Document Analysis", "API Limits"]
           });
         } else {
           throw geminiError;
         }
       }
      
             // Check if the response is empty or invalid
       if (!summaryText || summaryText.trim() === "") {
         throw new Error("Gemini returned an empty response");
       }
      
                                                       // Parse the JSON response
          let analysis;
          console.log("Raw Gemini response:", summaryText);
          console.log("Response length:", summaryText.length);
          console.log("Response type:", typeof summaryText);
         
         // Clean the response - remove any leading/trailing whitespace and common prefixes
         let cleanedResponse = summaryText.trim();
         
         // Remove common prefixes that might be added by AI models
         const prefixes = [
           "Here's the JSON response:",
           "The JSON response is:",
           "```json",
           "```",
           "JSON:",
           "Response:"
         ];
         
         for (const prefix of prefixes) {
           if (cleanedResponse.startsWith(prefix)) {
             cleanedResponse = cleanedResponse.substring(prefix.length).trim();
           }
         }
         
         // Remove trailing code blocks
         if (cleanedResponse.endsWith("```")) {
           cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3).trim();
         }
         
         console.log("Cleaned response:", cleanedResponse);
         
         try {
           // First, try to parse the cleaned response as JSON
           analysis = JSON.parse(cleanedResponse);
           console.log("Successfully parsed JSON:", analysis);
         } catch (parseError) {
           console.log("Initial JSON parse failed:", parseError.message);
           
           try {
             // If that fails, try to extract JSON from the response using a more robust regex
             const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
             if (jsonMatch) {
               console.log("Found JSON match:", jsonMatch[0]);
               analysis = JSON.parse(jsonMatch[0]);
             } else {
               console.log("No JSON pattern found, using fallback");
               // Fallback: treat the entire response as summary
               analysis = {
                 summary: cleanedResponse,
                 keyPoints: [],
                 topics: []
               };
             }
           } catch (secondParseError) {
             console.log("Second JSON parse failed:", secondParseError.message);
             // Final fallback if JSON parsing fails
             console.log("Using final fallback for response:", cleanedResponse);
             analysis = {
               summary: cleanedResponse,
               keyPoints: [],
               topics: []
             };
           }
         }

             // Ensure we have valid data even if parsing failed
       const result = {
         summary: analysis?.summary || cleanedResponse || summaryText || "Document processed successfully",
         keyPoints: analysis?.keyPoints || [],
         topics: analysis?.topics || [],
         metadata: {
           ...metadata,
           fileSize: documentFile.size,
           fileType: documentFile.type,
           originalWordCount: text.split(/\s+/).length,
           parsingSuccess: !!analysis?.summary,
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
