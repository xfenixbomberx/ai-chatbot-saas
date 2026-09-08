import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: Request) {
  try {
    // Public, unauthenticated endpoint (called by the embedded widget from
    // customer sites) -- always runs as the service role since there's no
    // user session to check RLS ownership against. Created lazily so a
    // missing SUPABASE_SERVICE_ROLE_KEY fails a request, not the build.
    const supabase = createServiceRoleClient();

    const { botId, message, sessionId } = await req.json();

    // Log the user message asynchronously
    if (sessionId) {
      supabase.from("chat_messages").insert([
        { session_id: sessionId, bot_id: botId, role: "user", content: message }
      ]).then(({ error }) => {
        if (error) console.error("❌ Failed to log user message:", error.message, error.details);
      });
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
    
    // Extract citation URL from the context
    let citationUrl = null;
    if (matchData && matchData.length > 0) {
      const urlMatch = matchData[0].content.match(/--- Page: (https?:\/\/[^\s]+) ---/);
      if (urlMatch) {
        citationUrl = urlMatch[1];
      }
    }

    // Fetch custom prompt if it exists
    const { data: botData } = await supabase.from('chatbots').select('system_prompt').eq('id', botId).single();
    
    const basePersonality = botData?.system_prompt 
      ? botData.system_prompt 
      : "You are a conversational, friendly, and helpful customer support bot for a company.";

    const currentDateTime = new Intl.DateTimeFormat('en-GB', { 
      timeZone: 'Europe/London', 
      weekday: 'long', 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    }).format(new Date());

    const systemPrompt = `${basePersonality}
    Your primary goal is to act as a world-class customer support and sales representative for this business. 
    You must answer questions based on the provided website context, but you should sound entirely human, natural, and persuasive.

    CRITICAL RULES:
    1. TONE & STYLE: Be extremely friendly, highly professional, and conversational. Never sound like a robot. DO NOT use Markdown formatting (no asterisks **, no hashes ###). Instead, use clear paragraph breaks, ALL CAPS for emphasis, and unicode bullet points (•) to make lists easy to read.
    2. GREETINGS: For general pleasantries ("Hi", "How are you"), respond warmly like a real person would. Do not trigger a handoff.
    3. SALES FOCUS: If the user is asking about services, pricing, or features, frame your answer in a way that highlights the value. Gently guide them toward taking action (e.g., "Let me know if you'd like to get started!").
    4. KNOWLEDGE LIMITS: For questions about the business, answer based ONLY on the provided context. If they ask a specific business question and the answer is absolutely nowhere in the context, DO NOT make up facts. Instead, immediately call the 'escalate_to_human' tool to alert the team.
    5. TIME AWARENESS: The current local time is ${currentDateTime}. If you suggest calling the business, ALWAYS check the opening hours in the context first. If they are currently closed, politely inform the user that the business is closed right now and ask for their email or advise them to call back when they open.
    
    WEBSITE CONTEXT:
    ${contextText}`;

    // 4. Generate the response using Gemini with Tools
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUSER QUESTION: " + message }] }
      ],
      config: {
        tools: [{
          functionDeclarations: [{
            name: "escalate_to_human",
            description: "Alert the human team to take over the conversation when the user asks a specific question that is completely absent from the website context, or specifically requests a human representative."
          }]
        }]
      }
    });

    let botAnswer = response.text || "";

    // 5. Human Handoff Logic via Tool Calling
    let isHandoff = false;
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "escalate_to_human") {
        isHandoff = true;
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
            to: "jordanpotter41@gmail.com",
            subject: "Human Handoff Alert - ChatBot Config",
            html: `<p>Your AI assistant couldn't answer the following question:</p><blockquote>${message}</blockquote><p>Session ID: ${sessionId}</p>`
          })
        }).catch(console.error);
      }
    }

    // Log the bot message asynchronously
    if (sessionId) {
      supabase.from("chat_messages").insert([
        { session_id: sessionId, bot_id: botId, role: "bot", content: botAnswer }
      ]).then(({ error }) => {
        if (error) console.error("❌ Failed to log bot message:", error.message, error.details);
      });
    }

    return NextResponse.json({ 
      answer: botAnswer, 
      citation: isHandoff ? null : citationUrl,
      isHandoff: isHandoff 
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
