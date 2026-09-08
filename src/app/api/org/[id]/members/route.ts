import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser, requireOrgAccess, AuthError, errorMessage } from "@/lib/auth";

// Lists members (with email, resolved via the admin API since auth.users
// isn't queryable from the regular client) and pending invites. Any member
// can view.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params;
    const user = await requireUser();
    await requireOrgAccess(user.id, orgId, "viewer");

    const supabase = createServiceRoleClient();

    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select("user_id, role, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });
    if (membersError) throw membersError;

    const emailsById = new Map<string, string>();
    await Promise.all(
      (members || []).map(async (m) => {
        const { data } = await supabase.auth.admin.getUserById(m.user_id);
        if (data.user?.email) emailsById.set(m.user_id, data.user.email);
      })
    );

    const { data: invites, error: invitesError } = await supabase
      .from("organization_invites")
      .select("id, email, role, created_at, expires_at, accepted_at")
      .eq("org_id", orgId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (invitesError) throw invitesError;

    return NextResponse.json({
      members: (members || []).map((m) => ({ ...m, email: emailsById.get(m.user_id) || null })),
      invites: invites || [],
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("List members error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to load members.") }, { status: 500 });
  }
}

// Invites someone to the organization by email. Admin/owner only.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params;
    const user = await requireUser();
    await requireOrgAccess(user.id, orgId, "admin");

    const { email, role } = await req.json();
    if (!email || !["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Missing email or invalid role" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single();

    const { data: invite, error } = await supabase
      .from("organization_invites")
      .insert({ org_id: orgId, email: email.trim().toLowerCase(), role, invited_by: user.id })
      .select()
      .single();

    if (error) throw error;

    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/org/invite/${invite.token}`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ChatBot Config <onboarding@resend.dev>",
        to: invite.email,
        subject: `You've been invited to join ${org?.name || "a team"} on ChatBot Config`,
        html: `<p>You've been invited to join <strong>${org?.name || "a team"}</strong> on ChatBot Config as ${
          role === "admin" ? "an" : "a"
        } ${role}.</p><p><a href="${acceptUrl}">Accept invite</a></p><p>This link expires in 7 days.</p>`,
      }),
    }).catch((err) => console.error("Invite email failed:", err));

    return NextResponse.json({ invite });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Invite member error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to send invite.") }, { status: 500 });
  }
}

// Changes a member's role, or removes them (role: null). Admin/owner only.
// Can't demote or remove the last remaining owner.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params;
    const user = await requireUser();
    await requireOrgAccess(user.id, orgId, "admin");

    const { userId: targetUserId, role } = await req.json();
    if (!targetUserId || !["owner", "admin", "editor", "viewer", null].includes(role)) {
      return NextResponse.json({ error: "Missing userId or invalid role" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: target } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", targetUserId)
      .single();

    if (target?.role === "owner" && role !== "owner") {
      const { count } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: "An organization needs at least one owner." }, { status: 400 });
      }
    }

    if (role === null) {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", targetUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("organization_members")
        .update({ role })
        .eq("org_id", orgId)
        .eq("user_id", targetUserId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Update member error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to update member.") }, { status: 500 });
  }
}

// Revokes a pending invite. Admin/owner only.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params;
    const user = await requireUser();
    await requireOrgAccess(user.id, orgId, "admin");

    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");
    if (!inviteId) {
      return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("organization_invites").delete().eq("id", inviteId).eq("org_id", orgId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Revoke invite error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to revoke invite.") }, { status: 500 });
  }
}
