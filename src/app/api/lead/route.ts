import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: Request) {
  try {
    // Public endpoint called cross-origin from the widget -- RLS is now on,
    // so this needs the real service-role key (the old anon-key fallback
    // assumed RLS was off and would otherwise silently insert nothing).
    // Created lazily so a missing SUPABASE_SERVICE_ROLE_KEY fails a
    // request, not the production build.
    const supabase = createServiceRoleClient();

    const { botId, email } = await req.json();

    if (!botId || !email) {
      return NextResponse.json({ error: "Missing botId or email" }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([{ bot_id: botId, email }])
      .select()
      .single();

    if (error) throw error;

    // Fire webhook if configured (Phase 3 Integration)
    try {
      const { data: botInfo } = await supabase.from("chatbots").select("*").eq("id", botId).single();
      if (botInfo && botInfo.webhook_url) {
        fetch(botInfo.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "lead_captured",
            bot_id: botId,
            bot_name: botInfo.name,
            lead: data
          })
        }).catch(err => console.error("Webhook firing failed:", err));
      }
    } catch(e) {}

    return NextResponse.json({ success: true, lead: data }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
