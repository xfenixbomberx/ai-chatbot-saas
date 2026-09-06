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
    const { botId, message, sessionId } = await req.json();

    // Log the user message asynchronously
    if (sessionId) {
      supabase.from("chat_messages").insert([
        { session_id: sessionId, bot_id: botId, role: "user", content: message }
      ]).then();
    }

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
    
    const systemPrompt = `You are a conversational, friendly, and helpful customer support bot for a company. 
    Your goal is to assist users based ONLY on the following context scraped from their website.
    
    CRITICAL RULES:
    1. For general greetings (e.g., "Hello", "Hi", "How are you"), respond warmly and conversationally. DO NOT trigger a handoff for greetings. Ask how you can help them today.
    2. For questions about the business, answer based ONLY on the provided context.
    3. If the user asks a specific question about the business and the answer is NOT in the context, DO NOT hallucinate. Instead, reply EXACTLY with the word "HANDOFF".
    4. Keep your answers polite, concise, and professional.
    
    WEBSITE CONTEXT:
    ${contextText}`;

    // 4. Generate the response using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUSER QUESTION: " + message }] }
      ]
    });

    let botAnswer = response.text || "";

    // 5. Human Handoff Logic
    if (botAnswer.trim() === "HANDOFF") {
      botAnswer = "I don't have enough information to answer that based on the website. I have alerted our human team and they will be in touch shortly!";
      
      // Trigger Resend Email Alert in the background
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "AI Support <onboarding@resend.dev>",
          to: "delivered@resend.dev", // In production, route to the bot owner's email
          subject: "Human Handoff Alert - AI Support Assistant",
          html: `<p>Your AI assistant couldn't answer the following question:</p><blockquote>${message}</blockquote><p>Session ID: ${sessionId}</p>`
        })
      }).catch(console.error);
    }

    // Log the bot message asynchronously
    if (sessionId) {
      supabase.from("chat_messages").insert([
        { session_id: sessionId, bot_id: botId, role: "bot", content: botAnswer }
      ]).then();
    }

    return NextResponse.json({ answer: botAnswer }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
