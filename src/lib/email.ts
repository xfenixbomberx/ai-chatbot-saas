import type { createServiceRoleClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

// Sender for every email the app sends through Resend. onboarding@resend.dev
// is Resend's shared test address and only delivers to the Resend account
// owner's own inbox -- set RESEND_FROM_EMAIL to an address on a domain
// verified in Resend (e.g. notifications@chatbotconfig.uk) for mail to reach
// customers.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export function sender(displayName: string) {
  return `${displayName} <${FROM_ADDRESS}>`;
}

// For interpolating untrusted text (visitor messages, org names) into email HTML.
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The widget accepts any reply containing "@" as an email ("it's bob@x.com"),
// so pull out the address itself before using it as a reply-to.
export function findEmail(text: string) {
  return text.match(/[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[A-Za-z]{2,}/)?.[0] ?? null;
}

// The bot's name and the emails of its organization's owners and admins --
// the people alerted when a visitor needs a human. Emails live in
// auth.users, which only the admin API can read.
export async function botTeam(supabase: ServiceClient, botId: string) {
  const { data: bot, error: botError } = await supabase
    .from("chatbots")
    .select("name, org_id")
    .eq("id", botId)
    .single();
  if (botError || !bot) throw botError || new Error(`Bot ${botId} not found`);

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", bot.org_id)
    .in("role", ["owner", "admin"]);
  if (membersError) throw membersError;

  const recipients = (
    await Promise.all(
      (members || []).map(async (m) => {
        const { data } = await supabase.auth.admin.getUserById(m.user_id);
        return data.user?.email;
      })
    )
  ).filter((email): email is string => !!email);

  return { botName: bot.name as string, recipients };
}

export async function sendEmail(email: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
