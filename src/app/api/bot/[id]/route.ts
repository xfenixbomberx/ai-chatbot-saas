import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: botId } = await params;

    // Public, unauthenticated endpoint -- the bot's UUID is its de facto
    // public "site key" (embedded in every customer's page source), so this
    // intentionally serves without a user session. Runs as the service role
    // since RLS now requires auth.uid() = user_id, which anonymous requests
    // never satisfy. Created lazily (not at module scope) so a missing
    // SUPABASE_SERVICE_ROLE_KEY fails a request, not the production build.
    const supabase = createServiceRoleClient();

    // Fetch the specific bot from Supabase
    const { data: bot, error } = await supabase
      .from("chatbots")
      .select("*")
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
