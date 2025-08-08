import { NextResponse } from "next/server";
import { requireAuth } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse request body
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Create task record
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        type: "URL_SUMMARIZATION",
        status: "PROCESSING",
        input: url,
        metadata: {
          url: url,
        },
      },
    });

    try {
             // Fetch web content
       const httpResponse = await axios.get(url, {
         timeout: 10000,
         headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
         }
       });

       const html = httpResponse.data;
      const $ = cheerio.load(html);

      // Extract text content
      const title = $('title').text().trim() || $('h1').first().text().trim();
      const description = $('meta[name="description"]').attr('content') || '';
      
      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();
      
      // Extract main content
      const mainContent = $('main, article, .content, .post, .entry').text() || $('body').text();
      
      // Clean up text
      let text = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()
        .substring(0, 8000); // Limit text length

      // Extract metadata
      const metadata = {
        title: title,
        author: $('meta[name="author"]').attr('content') || 
                $('.author, .byline').text().trim() || null,
        wordCount: text.split(/\s+/).length,
        readingTime: Math.ceil(text.split(/\s+/).length / 200), // Rough estimate: 200 words per minute
      };

      // Generate summary using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are a helpful assistant that summarizes web content. Provide a comprehensive summary, key points, and main topics. Format the response as JSON with keys: summary, keyPoints, topics.

Please analyze and summarize this web content:

Title: ${title}

Content: ${text}`;

      const geminiResult = await model.generateContent(prompt);
      const response = await geminiResult.response;
      const summaryText = response.text();
      
      // Parse the JSON response
      let analysis;
      try {
        // Extract JSON from the response (in case it's wrapped in markdown)
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: treat the entire response as summary
          analysis = {
            summary: summaryText,
            keyPoints: [],
            topics: []
          };
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        analysis = {
          summary: summaryText,
          keyPoints: [],
          topics: []
        };
      }

      const result = {
        originalUrl: url,
        summary: analysis.summary || summaryText,
        keyPoints: analysis.keyPoints || [],
        topics: analysis.topics || [],
        metadata: {
          ...metadata,
          description: description,
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
    console.error("URL summarization error:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: "Unable to access the URL. Please check if it's valid and accessible." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to summarize URL" },
      { status: 500 }
    );
  }
}
