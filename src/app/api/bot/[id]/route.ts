import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: botId } = await params;
    
    // Fetch the specific bot from Supabase
    const { data: bot, error } = await supabase
      .from("chatbots")
      .select("id, name, primary_color, icon, website_url")
      .eq("id", botId)
      .single();

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ bot }, { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
