import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({ bot }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
