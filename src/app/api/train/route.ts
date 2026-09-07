import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

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

    const fetchOptions = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for the initial root page
      const response = await fetch(websiteUrl, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Find internal links and prioritize valuable pages
      const valuableKeywords = ["service", "treatment", "price", "fee", "about", "faq", "contact", "shipping", "return", "policy", "help"];
      const allLinks: string[] = [];
      
      $("a").each((i, link) => {
        const href = $(link).attr("href");
        if (href && !href.includes("#") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.toLowerCase().endsWith(".pdf")) {
          try {
            // This safely handles relative links (e.g. "about" -> "https://site.com/about") 
            // and absolute links.
            const parsedUrl = new URL(href, baseUrl);
            
            // Only keep links that belong to the same root domain (ignores www. mismatches)
            const baseHostname = new URL(baseUrl).hostname.replace(/^www\./, '');
            if (parsedUrl.hostname.includes(baseHostname)) {
              // Strip trailing slashes to avoid duplicates
              let cleanUrl = parsedUrl.href;
              if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
              allLinks.push(cleanUrl);
            }
          } catch (e) {
            // Invalid URL format, ignore
          }
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

      // Keep homepage + top 30 most valuable pages (to prevent server timeouts on massive stores)
      urlsToScrape = Array.from(new Set([websiteUrl, ...uniqueLinks])).slice(0, 30);
    } catch(e) {
      console.warn("Failed to fetch initial page for links.");
      urlsToScrape = [websiteUrl]; // Fallback to just homepage if link extraction fails
    }

    console.log(`Discovered pages to scrape:`, urlsToScrape);

    // Fetch and parse all pages in parallel with a timeout to prevent hanging
    const pageContents = await Promise.all(urlsToScrape.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per page
        
        const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeoutId);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        $("script, style, noscript, nav, footer, header, iframe").remove();
        const text = $("body").text().replace(/\s+/g, " ").trim();
        if (text && text.length > 50) {
          return "\n\n--- Page: " + url + " ---\n\n" + text;
        }
      } catch (e) {
        console.warn(`Failed or timed out scraping ${url}`);
      }
      return "";
    }));
    
    allText += pageContents.join("");

    if (!allText || allText.length < 50) {
      return NextResponse.json({ error: "Not enough readable text found on the website." }, { status: 400 });
    }

    console.log(`[2/4] Chunking scraped text (${allText.length} characters)...`);
    // 2. Chunk the text so the AI can process it piece by piece
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    let chunks = await splitter.createDocuments([allText]);
    
    // Hard cap chunks to prevent Vercel 60s timeouts on massive websites
    if (chunks.length > 250) {
      console.warn(`Capping chunks at 250 (was ${chunks.length}) to prevent server timeouts.`);
      chunks = chunks.slice(0, 250);
    }

    console.log(`[3/4] Generating Embeddings via Gemini (${chunks.length} chunks)...`);
    
    // 3. Generate Embeddings & Save to DB (Optimized Bulk Insert)
    const dbRecords: { bot_id: string; content: string; embedding: number[] }[] = [];
    
    // Process embeddings in larger parallel chunks, but don't hit the DB yet
    const BATCH_SIZE = 20;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (chunk) => {
        try {
          const embeddingResponse = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: chunk.pageContent,
            config: { outputDimensionality: 768 }
          });
          
          const embedding = embeddingResponse.embeddings?.[0]?.values;
          if (embedding) {
            dbRecords.push({
              bot_id: botId,
              content: chunk.pageContent,
              embedding: embedding,
            });
          }
        } catch (err) {
          console.error("Failed to embed chunk:", err);
        }
      }));
    }

    if (dbRecords.length > 0) {
      console.log(`[4/4] Bulk inserting ${dbRecords.length} records to Supabase...`);
      const { error } = await supabase.from("bot_documents").insert(dbRecords);
      if (error) console.error("Bulk Insert Error:", error);
    }

    console.log(`Training complete!`);
    return NextResponse.json({ success: true, chunksProcessed: chunks.length, pagesScraped: urlsToScrape.length });
    
  } catch (error: any) {
    console.error("Training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
