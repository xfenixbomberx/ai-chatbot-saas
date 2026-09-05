import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { botId, message } = await req.json();

    // 1. Convert user's message to a vector
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: message,
      config: { outputDimensionality: 768 }
    });
    const queryEmbedding = embeddingResponse.embeddings?.[0]?.values;

    // 2. Search Supabase for matching website data (Similarity Search)
    const { data: matchData, error } = await supabase.rpc('match_bot_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, 
      match_count: 5,
      p_bot_id: botId
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      throw error;
    }

    // 3. Construct the prompt with the found context
    const contextText = matchData?.map((doc: any) => doc.content).join("\n\n") || "No relevant context found on the website.";
    
    const systemPrompt = `You are a helpful customer support bot for a company. 
    Answer the user's question based ONLY on the following context scraped from their website.
    If the answer is not in the context, say "I don't have enough information to answer that based on the website."
    Be polite, concise, and professional.
    
    WEBSITE CONTEXT:
    ${contextText}`;

    // 4. Generate the response using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUSER QUESTION: " + message }] }
      ]
    });

    return NextResponse.json({ answer: response.text }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
