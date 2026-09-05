import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { botId, websiteUrl } = await req.json();

    if (!botId || !websiteUrl) {
      return NextResponse.json({ error: "Missing botId or websiteUrl" }, { status: 400 });
    }

    console.log(`[1/4] Scraping website: ${websiteUrl}...`);
    // 1. Scrape the website
    const response = await fetch(websiteUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove unnecessary elements to get clean text
    $("script, style, noscript, nav, footer, header").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "Not enough readable text found on the website." }, { status: 400 });
    }

    console.log(`[2/4] Chunking scraped text (${text.length} characters)...`);
    // 2. Chunk the text so the AI can process it piece by piece
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text]);

    console.log(`[3/4] Generating Embeddings via Gemini & Saving to DB (${chunks.length} chunks)...`);
    // 3. Generate Embeddings & Save to DB
    for (const chunk of chunks) {
      // Ask Gemini to turn the text chunk into a vector array
      const embeddingResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunk.pageContent,
        config: { outputDimensionality: 768 }
      });
      
      const embedding = embeddingResponse.embeddings?.[0]?.values;
      if (!embedding) continue;

      // Save the text chunk AND its vector embedding into our pgvector database
      const { error } = await supabase
        .from("bot_documents")
        .insert({
          bot_id: botId,
          content: chunk.pageContent,
          embedding: embedding,
        });
        
      if (error) {
        console.error("Database Insert Error:", error);
      }
    }

    console.log(`[4/4] Training complete!`);
    return NextResponse.json({ success: true, chunksProcessed: chunks.length });
    
  } catch (error: any) {
    console.error("Training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
