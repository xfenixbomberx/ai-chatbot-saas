"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie-consent")) setIsVisible(true);
    } catch {
      /* storage unavailable — stay hidden */
    }
  }, []);

  const decide = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem("cookie-consent", choice);
    } catch {
      /* ignore */
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="ds-rise mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-white/95 p-5 shadow-[var(--shadow-xl)] backdrop-blur-xl sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Cookie className="h-[18px] w-[18px]" />
        </span>

        <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">
          We use cookies to improve your experience and analyse traffic. See our{" "}
          <Link
            href="/privacy"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Terms
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-medium text-ink-strong transition-colors hover:bg-surface-muted"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-lg bg-ink-strong px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
