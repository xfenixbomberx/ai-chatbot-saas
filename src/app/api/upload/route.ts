import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const botId = formData.get("botId") as string;
    const file = formData.get("file") as File;

    if (!botId || !file) {
      return NextResponse.json({ error: "Missing botId or file" }, { status: 400 });
    }

    const supportedTypes = ["application/pdf", "text/plain", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Unsupported file type. Please upload a PDF, TXT, or image file (PNG, JPG, WEBP).`
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedText = "";

    if (file.type === "application/pdf") {
      const PDFParser = (await import("pdf2json")).default;
      parsedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
        pdfParser.parseBuffer(buffer);
      });

    } else if (file.type === "text/plain") {
      parsedText = buffer.toString("utf-8");

    } else if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      // Use Gemini Vision to extract all text from the image
      console.log("[1/3] Extracting text from image using Gemini Vision...");
      const base64Image = buffer.toString("base64");
      const mimeType = file.type as "image/png" | "image/jpeg" | "image/webp";

      const visionResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              }
            },
            {
              text: "Please extract ALL text visible in this image. Return only the raw text content, preserving structure where possible. Do not add any commentary or explanation."
            }
          ]
        }]
      });

      parsedText = visionResponse.text || "";
      if (!parsedText.trim()) {
        return NextResponse.json({ error: "No readable text found in the image. Please ensure the image contains visible text." }, { status: 400 });
      }
    }

    const cleanText = parsedText.replace(/\s+/g, " ").trim();
    if (!cleanText || cleanText.length < 50) {
      return NextResponse.json({ error: "Not enough readable text found in the document." }, { status: 400 });
    }

    console.log(`[1/3] Parsed document (${cleanText.length} characters)...`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,  // Larger chunks = fewer API calls
      chunkOverlap: 150,
    });
    const chunks = await splitter.createDocuments([cleanText]);

    console.log(`[2/3] Generating Embeddings & Saving to DB (${chunks.length} chunks)...`);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const chunk of chunks) {
      try {
        const embeddingResponse = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: chunk.pageContent,
          config: { outputDimensionality: 768 }
        });
        
        const embedding = embeddingResponse.embeddings?.[0]?.values;
        if (!embedding) continue;

        const { error } = await supabase
          .from("bot_documents")
          .insert({
            bot_id: botId,
            content: chunk.pageContent,
            embedding: embedding,
          });
          
        if (error) console.error("Database Insert Error:", error);

        // Throttle to avoid hitting Gemini API rate limits
        await sleep(350);

      } catch (chunkError: any) {
        // If rate limited, wait longer and retry once
        if (chunkError?.status === 429) {
          console.warn("Rate limited — waiting 5s before retrying...");
          await sleep(5000);
          try {
            const retryResponse = await ai.models.embedContent({
              model: 'gemini-embedding-2',
              contents: chunk.pageContent,
              config: { outputDimensionality: 768 }
            });
            const retryEmbedding = retryResponse.embeddings?.[0]?.values;
            if (retryEmbedding) {
              await supabase.from("bot_documents").insert({
                bot_id: botId,
                content: chunk.pageContent,
                embedding: retryEmbedding,
              });
            }
          } catch (retryError) {
            console.error("Retry also failed, skipping chunk:", retryError);
          }
        } else {
          console.error("Chunk embedding error:", chunkError);
        }
      }
    }

    console.log(`[3/3] PDF Training complete!`);
    return NextResponse.json({ success: true, chunksProcessed: chunks.length });
    
  } catch (error: any) {
    console.error("PDF Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
