import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser, AuthError, errorMessage } from "@/lib/auth";

// Accepts an org invite by token. Runs as the service role because the
// invitee isn't a member yet -- RLS on organization_invites only lets
// existing members read a row, so an anonymous-by-membership invitee can't
// look up their own invite via the regular client.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const user = await requireUser();

    const supabase = createServiceRoleClient();

    const { data: invite, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "This invite is invalid or has already been used." }, { status: 404 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Sign in with that email to accept it.` },
        { status: 403 }
      );
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .upsert({ org_id: invite.org_id, user_id: user.id, role: invite.role }, { onConflict: "org_id,user_id" });

    if (memberError) throw memberError;

    await supabase.from("organization_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    return NextResponse.json({ success: true, orgId: invite.org_id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to accept invite.") }, { status: 500 });
  }
}
