import { NextResponse, after } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { botTeam, escapeHtml, findEmail, sendEmail, sender } from "@/lib/email";

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

    const body = await req.json();
    const { botId, email } = body;
    // The widget sends sessionId, the demo page session_id.
    const sessionId: string | undefined = body.sessionId ?? body.session_id;

    if (!botId || !email) {
      return NextResponse.json({ error: "Missing botId or email" }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([{ bot_id: botId, email, session_id: sessionId ?? null }])
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

    if (sessionId) after(() => sendLateContactEmail(supabase, { botId, sessionId, email }));

    return NextResponse.json({ success: true, lead: data }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// A visitor whose conversation was already handed off has now left their
// email. The team's handoff alert went out without a way to reach them, so
// send it on, with the visitor as the reply-to.
async function sendLateContactEmail(
  supabase: ReturnType<typeof createServiceRoleClient>,
  { botId, sessionId, email }: { botId: string; sessionId: string; email: string }
) {
  try {
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("bot_id", botId)
      .eq("session_id", sessionId)
      .eq("is_handoff", true);
    if (error) throw error;
    if (!count) return;

    const { botName, recipients } = await botTeam(supabase, botId);
    if (recipients.length === 0) return;

    const visitorEmail = findEmail(email);
    await sendEmail({
      from: sender("ChatBot Config"),
      to: recipients,
      subject: `Handoff update: the ${botName} visitor left their email`,
      html: `<p>The visitor your <strong>${escapeHtml(botName)}</strong> assistant handed off to you has left their email: <strong>${escapeHtml(visitorEmail || email)}</strong>.</p>
${visitorEmail ? "<p>Reply to this email to reach them directly.</p>" : ""}
<p style="color:#888">Session ID: ${escapeHtml(sessionId)}</p>`,
      reply_to: visitorEmail ?? undefined,
    });
  } catch (err) {
    console.error("Handoff follow-up email failed:", err);
  }
}
