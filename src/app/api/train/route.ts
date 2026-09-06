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

    console.log(`[1/4] Starting Deep Scrape for: ${websiteUrl}...`);
    
    // Helper to safely parse URLs
    const getBaseUrl = (url: string) => new URL(url).origin;
    const baseUrl = getBaseUrl(websiteUrl);

    let urlsToScrape = [websiteUrl];
    let allText = "";

    try {
      const response = await fetch(websiteUrl);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Find internal links and prioritize valuable pages
      const valuableKeywords = ["service", "treatment", "price", "fee", "about", "faq", "contact"];
      const allLinks: string[] = [];
      
      $("a").each((i, link) => {
        const href = $(link).attr("href");
        if (href && !href.includes("#") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
          let fullUrl = "";
          if (href.startsWith("/") && !href.startsWith("//")) {
            fullUrl = baseUrl + href;
          } else if (href.startsWith(baseUrl)) {
            fullUrl = href;
          }
          if (fullUrl) allLinks.push(fullUrl);
        }
      });

      // Deduplicate
      const uniqueLinks = Array.from(new Set(allLinks));
      
      // Sort links: prioritize those containing valuable keywords
      uniqueLinks.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aScore = valuableKeywords.filter(kw => aLower.includes(kw)).length;
        const bScore = valuableKeywords.filter(kw => bLower.includes(kw)).length;
        return bScore - aScore; // Highest score first
      });

      // Keep homepage + top 4 most valuable pages
      urlsToScrape = Array.from(new Set([websiteUrl, ...uniqueLinks])).slice(0, 5);
    console.log(`Discovered pages to scrape:`, urlsToScrape);

    for (const url of urlsToScrape) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        $("script, style, noscript, nav, footer, header").remove();
        const text = $("body").text().replace(/\s+/g, " ").trim();
        if (text && text.length > 50) {
          allText += "\n\n--- Page: " + url + " ---\n\n" + text;
        }
      } catch (e) {
        console.warn(`Failed to scrape ${url}`);
      }
    }

    if (!allText || allText.length < 50) {
      return NextResponse.json({ error: "Not enough readable text found on the website." }, { status: 400 });
    }

    console.log(`[2/4] Chunking scraped text (${allText.length} characters)...`);
    // 2. Chunk the text so the AI can process it piece by piece
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([allText]);

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
    return NextResponse.json({ success: true, chunksProcessed: chunks.length, pagesScraped: urlsToScrape.length });
    
  } catch (error: any) {
    console.error("Training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
