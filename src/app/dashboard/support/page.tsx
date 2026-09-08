"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send, Loader2, CheckCircle2, BookOpen, ArrowUpRight } from "lucide-react";

const HANDBOOK_URL = "https://claude.ai/code/artifact/afadebf2-9f2c-4352-a565-41f9108027fb";

const HELP = [
  {
    q: "How do I train my chatbot?",
    a: "Open the bot from your dashboard and use the Training tab. You can point it at a website URL to crawl, or upload a PDF. Retraining is unlimited — run it again whenever your content changes.",
  },
  {
    q: "How do I embed the widget on my site?",
    a: "Under the Training & Integration tab of your bot, copy the one-line script snippet and paste it just before the closing </body> tag of your site template.",
  },
  {
    q: "Why is my bot saying it doesn't know?",
    a: "It only answers from content it has indexed. If a topic isn't on the pages we crawled, add it to your site or upload a PDF covering it, then retrain.",
  },
  {
    q: "How do I change my plan?",
    a: "Go to Settings → Subscription & billing and open the billing portal. You can upgrade, downgrade or cancel there at any time.",
  },
];

export default function SupportPage() {
  const [category, setCategory] = useState("Technical Support");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, replyTo: email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
            Help &amp; support
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Send us a message and the team will get back to you.
          </p>
        </div>

        {/* Handbook banner */}
        <a
          href={HANDBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-between gap-6 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-xs)] transition-colors hover:border-accent/30"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-strong">
                Read the ChatBot Config Handbook
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                A full walkthrough — from creating your first chatbot to embedding it on your site.
              </p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3.5 py-2 text-sm font-semibold text-ink-strong">
            Open guide
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </a>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Form */}
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-positive-soft text-positive">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-6 text-lg font-semibold text-ink-strong">
                  Message sent
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-muted">
                  We&apos;ve received your request and will reply to{" "}
                  <span className="font-medium text-ink-strong">{email}</span> soon.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-accent hover:text-accent-hover"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="ds-label">How can we help?</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="ds-input h-[46px]"
                    >
                      <option>Technical Support</option>
                      <option>Billing Question</option>
                      <option>Sales / Custom Plan</option>
                      <option>Feature Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="ds-label">Your email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="ds-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="ds-label">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail…"
                    className="ds-input resize-none"
                  />
                </div>

                {status === "error" && (
                  <p className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                    Failed to send message. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Mail className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink-strong">
                Response time
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                We aim to reply to technical tickets within 24 hours on business
                days.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-positive-soft text-positive">
                <MessageCircle className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink-strong">
                Enterprise plans
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Need higher limits or a custom integration? Choose “Sales” above to
                reach the account team.
              </p>
            </div>
          </aside>
        </div>

        {/* Help articles */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-ink-strong">Common questions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {HELP.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]"
              >
                <h3 className="text-[15px] font-semibold text-ink-strong">
                  {item.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
