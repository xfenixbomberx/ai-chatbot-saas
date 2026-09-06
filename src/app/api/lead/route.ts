import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use the service role key here to insert leads bypassing RLS if needed,
// but anon key is fine since RLS is disabled in MVP.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { botId, email } = await req.json();

    if (!botId || !email) {
      return NextResponse.json({ error: "Missing botId or email" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([{ bot_id: botId, email }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, lead: data });
  } catch (error: any) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
