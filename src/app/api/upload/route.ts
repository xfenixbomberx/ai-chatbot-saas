import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedText = "";
    if (file.type === "application/pdf") {
      const PDFParser = (await import("pdf2json")).default;
      
      parsedText = await new Promise((resolve, reject) => {
        // Use 'true' instead of 1 to satisfy TypeScript
        const pdfParser = new PDFParser(null, true);
        
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        
        pdfParser.parseBuffer(buffer);
      });
    } else {
      parsedText = buffer.toString("utf-8"); // fallback for txt files
    }

    const cleanText = parsedText.replace(/\s+/g, " ").trim();
    if (!cleanText || cleanText.length < 50) {
      return NextResponse.json({ error: "Not enough readable text found in the document." }, { status: 400 });
    }

    console.log(`[1/3] Parsed document (${cleanText.length} characters)...`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([cleanText]);

    console.log(`[2/3] Generating Embeddings & Saving to DB (${chunks.length} chunks)...`);
    
    for (const chunk of chunks) {
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
    }

    console.log(`[3/3] PDF Training complete!`);
    return NextResponse.json({ success: true, chunksProcessed: chunks.length });
    
  } catch (error: any) {
    console.error("PDF Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
