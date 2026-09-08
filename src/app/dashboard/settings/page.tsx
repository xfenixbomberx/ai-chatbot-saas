"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  User,
  CreditCard,
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";

export default function SettingsPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrg();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const isSubscribed = currentOrg?.plan_status === "active";

  const handleManageBilling = async () => {
    if (!currentOrg) return;
    setIsBillingLoading(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: currentOrg.id, email: user.email }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to load billing portal.");
      }
    } catch {
      alert("Error loading billing portal.");
    } finally {
      setIsBillingLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || isOrgLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
            Settings
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Your account details and subscription.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Profile */}
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
            <header className="flex items-center gap-2.5 border-b border-line bg-surface-muted px-6 py-4">
              <User className="h-[18px] w-[18px] text-ink-muted" />
              <h2 className="text-[15px] font-semibold text-ink-strong">Profile</h2>
            </header>
            <div className="p-6">
              <label className="ds-label">Email address</label>
              <input
                type="text"
                disabled
                value={user?.email || ""}
                className="ds-input max-w-md cursor-not-allowed bg-surface-muted text-ink-muted"
              />
              <p className="mt-2 text-[13px] text-ink-faint">
                Managed by your authentication provider and used for account
                notifications.
              </p>
            </div>
          </section>

          {/* Billing */}
          {currentOrg && (
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
              <header className="flex items-center gap-2.5 border-b border-line bg-surface-muted px-6 py-4">
                <CreditCard className="h-[18px] w-[18px] text-ink-muted" />
                <h2 className="text-[15px] font-semibold text-ink-strong">
                  Subscription &amp; billing — {currentOrg.name}
                </h2>
              </header>

              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-muted">
                      Current plan
                    </span>
                    {isSubscribed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2.5 py-1 text-[13px] font-semibold text-positive">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Active · {currentOrg.plan_tier}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-[13px] font-semibold text-ink-muted">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-muted">
                    {isSubscribed
                      ? "You have full access to chatbot creation, training and the embeddable widget."
                      : "Choose a plan to unlock chatbot creation and training."}
                  </p>
                </div>

                {isSubscribed ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={isBillingLoading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-60"
                  >
                    {isBillingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Manage billing
                        <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover"
                  >
                    Choose a plan
                  </Link>
                )}
              </div>

              <div className="border-t border-line bg-surface-muted px-6 py-3.5">
                <p className="text-[13px] text-ink-faint">
                  Payments and invoices are handled securely by Stripe. Cancel or
                  change plan at any time from the billing portal.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
