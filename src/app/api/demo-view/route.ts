import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Public, unauthenticated: the demo page pings this on load so the dashboard
// can show that a link was opened even when the visitor never types. Writes
// go through the service-role key because there is no session to check RLS
// against -- the worst a caller can do is inflate the view count for a bot id
// they already have.
export async function POST(req: Request) {
  try {
    const { botId, sessionId, referrer } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: "Missing botId" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("demo_views").insert([
      {
        bot_id: botId,
        session_id: sessionId ?? null,
        referrer: typeof referrer === "string" && referrer ? referrer.slice(0, 500) : null,
      },
    ]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging demo view:", error);
    const message = error instanceof Error ? error.message : "Failed to log demo view";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
