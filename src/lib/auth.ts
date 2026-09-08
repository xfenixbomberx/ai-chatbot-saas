import { createClient } from "@/lib/supabase/server";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

// Higher index = more privilege. Used to check "at least this role."
const ROLE_RANK: OrgRole[] = ["viewer", "editor", "admin", "owner"];

function hasMinRole(role: OrgRole, minRole: OrgRole) {
  return ROLE_RANK.indexOf(role) >= ROLE_RANK.indexOf(minRole);
}

// Resolves the logged-in user from the request's session cookie. Throws
// AuthError(401) if there is none.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError("Not signed in.", 401);
  }
  return user;
}

// Confirms the given user belongs to the given bot's organization with at
// least `minRole`. Route handlers use the service-role key (bypasses RLS),
// so this application-level check is what actually protects them -- RLS is
// the backstop for direct client queries, not the enforcement point here.
export async function requireBotOrgAccess(userId: string, botId: string, minRole: OrgRole = "viewer") {
  const supabase = await createClient();

  const { data: bot, error: botError } = await supabase
    .from("chatbots")
    .select("org_id")
    .eq("id", botId)
    .single();

  if (botError || !bot) {
    throw new AuthError("Chatbot not found.", 404);
  }

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", bot.org_id)
    .eq("user_id", userId)
    .single();

  if (memberError || !membership || !hasMinRole(membership.role as OrgRole, minRole)) {
    throw new AuthError("You don't have access to this chatbot.", 403);
  }

  return { orgId: bot.org_id as string, role: membership.role as OrgRole };
}

// Confirms the given user belongs to the given organization with at least
// `minRole`. Used by the org management routes (members, invites).
export async function requireOrgAccess(userId: string, orgId: string, minRole: OrgRole = "viewer") {
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (error || !membership || !hasMinRole(membership.role as OrgRole, minRole)) {
    throw new AuthError("You don't have access to this organization.", 403);
  }

  return { role: membership.role as OrgRole };
}
