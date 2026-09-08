"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Plus,
  Bot,
  Globe,
  X,
  Trash2,
  Check,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/org-context";

// Live-looking Stripe price IDs used to be hardcoded here as fallbacks --
// removed since they shouldn't ship in client source regardless of the
// server-side allowlist in api/checkout. Set the env vars in .env.local.
const PLANS = [
  {
    name: "Starter",
    price: "£49",
    tagline: "One site, covered after hours.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    features: ["1 AI chatbot", "Website crawling & training", "Lead capture", "Standard analytics"],
    featured: false,
  },
  {
    name: "Pro",
    price: "£99",
    tagline: "For teams running a few properties.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    features: [
      "3 AI chatbots",
      "Unlimited retraining",
      "Custom branding & colours",
      "PDF document upload",
      "Live agent handoff",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "£299",
    tagline: "Agencies and multi-brand rollouts.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
    features: [
      "10 AI chatbots",
      'White-label — no "powered by"',
      "Webhooks & CRM integrations",
      "Dedicated account manager",
      "Priority support",
    ],
    featured: false,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { currentOrg, orgs, isLoading: isOrgLoading, refetch: refetchOrgs } = useOrg();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [botColor, setBotColor] = useState("#4f46e5");
  const [botIcon, setBotIcon] = useState("bot");
  const [isLoading, setIsLoading] = useState(false);
  const [isTrainingAll, setIsTrainingAll] = useState(false);

  const [bots, setBots] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setUser(session.user);
    });
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      router.replace("/dashboard");
      // Subscription state is set by the Stripe webhook (api/stripe/webhook),
      // not by this page. The webhook is normally near-instant, but the
      // browser can land back here a moment before it's processed -- give
      // it a couple of retries via the org context's refetch.
      let attemptsLeft = 3;
      const poll = async () => {
        await refetchOrgs();
        attemptsLeft -= 1;
        if (attemptsLeft > 0) setTimeout(poll, 1500);
      };
      poll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentOrg) {
      fetchBots(currentOrg.id);
    } else if (!isOrgLoading) {
      setIsFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, isOrgLoading]);

  const fetchBots = async (orgId: string) => {
    setIsFetching(true);
    const { data } = await supabase
      .from("chatbots")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (data) setBots(data);
    setIsFetching(false);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreatingOrg(true);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else await refetchOrgs();
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!currentOrg) return;
    setIsCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: currentOrg.id, email: user.email, priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + data.error);
        setIsCheckoutLoading(false);
      }
    } catch {
      alert("Failed to connect to checkout.");
      setIsCheckoutLoading(false);
    }
  };

  const handleTrainAll = async () => {
    if (!bots || bots.length === 0) return;
    setIsTrainingAll(true);
    let successCount = 0;

    for (const bot of bots) {
      if (bot.website_url) {
        try {
          const res = await fetch("/api/train", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId: bot.id, websiteUrl: bot.website_url }),
          });
          if (res.ok) successCount++;
        } catch (error) {
          console.error(`Failed to train bot ${bot.name}`, error);
        }
      }
    }

    setIsTrainingAll(false);
    alert(`Successfully trained ${successCount} chatbots!`);
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setIsLoading(true);

    let formattedUrl = websiteUrl.trim();
    if (
      formattedUrl &&
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    const { error } = await supabase.from("chatbots").insert([
      {
        name: botName,
        website_url: formattedUrl,
        org_id: currentOrg.id,
        primary_color: botColor,
        icon: botIcon,
      },
    ]);

    setIsLoading(false);

    if (error) {
      alert("Error creating chatbot: " + error.message);
    } else {
      if (formattedUrl) {
        const newBot = await supabase
          .from("chatbots")
          .select("id")
          .eq("org_id", currentOrg.id)
          .eq("website_url", formattedUrl)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (newBot.data?.id) {
          fetch("/api/train", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId: newBot.data.id, websiteUrl: formattedUrl }),
          }).catch(console.error);
        }
      }

      setIsModalOpen(false);
      setBotName("");
      setWebsiteUrl("");
      setBotColor("#4f46e5");
      setBotIcon("bot");
      fetchBots(currentOrg.id);
    }
  };

  const handleDeleteBot = async (e: React.MouseEvent, botId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chatbot? This cannot be undone.")) return;

    const { error } = await supabase.from("chatbots").delete().eq("id", botId);
    if (error) alert("Error deleting chatbot: " + error.message);
    else if (currentOrg) fetchBots(currentOrg.id);
  };

  /* ------------------------------ Loading ----------------------------- */

  if (isOrgLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  /* --------------------------- No organization ------------------------- */

  if (orgs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-[var(--shadow-xs)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Building2 className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-lg font-semibold text-ink-strong">Create your organization</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            Chatbots belong to an organization, so your team can share access to them.
          </p>
          <form onSubmit={handleCreateOrg} className="mt-6 space-y-3">
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Acme Inc"
              className="ds-input"
            />
            <button
              type="submit"
              disabled={isCreatingOrg}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {isCreatingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create organization"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ------------------------------ Paywall ----------------------------- */

  if (currentOrg?.plan_status !== "active") {
    return (
      <div className="px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-positive" />
              Secure checkout by Stripe
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-ink-strong">
              Choose your plan
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Pick a plan to unlock chatbot creation. Upgrade, downgrade or cancel
              from your dashboard at any time.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "relative rounded-2xl border-2 border-accent bg-white p-8 shadow-[var(--shadow-lg)] lg:-mt-4"
                    : "relative rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-xs)]"
                }
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-ink-strong">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{plan.tagline}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-ink-strong">
                    {plan.price}
                  </span>
                  <span className="text-sm font-medium text-ink-muted">/month</span>
                </p>

                <button
                  onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                  disabled={isCheckoutLoading || !plan.priceId}
                  title={!plan.priceId ? "This plan isn't configured yet." : undefined}
                  className={
                    plan.featured
                      ? "mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                      : "mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  }
                >
                  {isCheckoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Choose {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <ul className="mt-7 space-y-3 border-t border-line pt-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[15px] text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- Normal state -------------------------- */

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
              My chatbots
            </h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              {bots.length === 0
                ? "Create your first assistant to get started."
                : `${bots.length} assistant${bots.length === 1 ? "" : "s"} · manage and retrain them here.`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTrainAll}
              disabled={isTrainingAll || bots.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isTrainingAll ? "animate-spin" : ""}`} />
              {isTrainingAll ? "Training…" : "Retrain all"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New chatbot
            </button>
          </div>
        </div>

        <div className="mt-8">
          {isFetching ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[148px] animate-pulse rounded-2xl border border-line bg-white"
                />
              ))}
            </div>
          ) : bots.length === 0 ? (
            <div className="ds-dots rounded-2xl border border-dashed border-line-strong bg-white px-8 py-20 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Bot className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-lg font-semibold text-ink-strong">
                No chatbots yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-muted">
                Point one at your website and it will be trained and ready to embed
                in about a minute.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" />
                Create your first chatbot
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bots.map((bot) => (
                <Link
                  href={`/dashboard/bot/${bot.id}`}
                  key={bot.id}
                  className="group relative rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]"
                >
                  <button
                    onClick={(e) => handleDeleteBot(e, bot.id)}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-faint opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                    title="Delete chatbot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3 pr-8">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-white"
                      style={{ backgroundColor: bot.primary_color || "#4f46e5" }}
                    >
                      {bot.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <h3 className="truncate text-[15px] font-semibold text-ink-strong">
                      {bot.name}
                    </h3>
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                    <span className="truncate font-mono text-[12px] text-ink-muted">
                      {bot.website_url?.replace(/^https?:\/\//, "") || "No URL"}
                    </span>
                  </div>

                  <span className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-accent">
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------ Modal ------------------------------ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-strong/35 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="ds-rise relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xl)]">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-[17px] font-semibold text-ink-strong">
                  New chatbot
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  Training starts as soon as you create it.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-strong"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBot}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="ds-label">Bot name</label>
                  <input
                    type="text"
                    required
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. Acme Support"
                    className="ds-input"
                  />
                </div>

                <div>
                  <label className="ds-label">Website to train on</label>
                  <input
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="www.example.com"
                    className="ds-input"
                  />
                  <p className="mt-1.5 text-[13px] text-ink-faint">
                    We&apos;ll crawl the pages we can reach from this address.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="ds-label">Brand colour</label>
                    <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-white p-1.5">
                      <input
                        type="color"
                        required
                        value={botColor}
                        onChange={(e) => setBotColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-[13px] uppercase text-ink-muted">
                        {botColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="ds-label">Widget icon</label>
                    <select
                      value={botIcon}
                      onChange={(e) => setBotIcon(e.target.value)}
                      className="ds-input h-[46px]"
                    >
                      <option value="bot">Robot</option>
                      <option value="message">Message bubble</option>
                      <option value="sparkles">Sparkles</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-line bg-surface-muted px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create chatbot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
