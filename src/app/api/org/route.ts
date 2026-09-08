import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser, AuthError, errorMessage } from "@/lib/auth";

// Creates a new organization with the current user as owner. Must run as
// the service role -- inserting the first membership row can't satisfy the
// "existing owner/admin" RLS check on organization_members, since there
// are no members yet.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { name } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing organization name" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (orgError) throw orgError;

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ org_id: org.id, user_id: user.id, role: "owner" });

    if (memberError) {
      // Don't leave a memberless, inaccessible org behind.
      await supabase.from("organizations").delete().eq("id", org.id);
      throw memberError;
    }

    return NextResponse.json({ org });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Create organization error:", error);
    return NextResponse.json({ error: errorMessage(error, "Failed to create organization.") }, { status: 500 });
  }
}
