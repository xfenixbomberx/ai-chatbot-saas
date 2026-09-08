"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Bot, Loader2, ArrowLeft, Check, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage("Check your email for the confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        // Honour a `next` param (e.g. set by middleware when redirecting
        // from an org invite link) instead of always landing on /dashboard.
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next && next.startsWith("/dashboard") ? next : "/dashboard");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-[1fr_460px]">
      {/* ---------------- Brand panel ---------------- */}
      <aside className="relative hidden overflow-hidden bg-[#0f1218] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[520px] rounded-full bg-accent/25 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:56px_56px]" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Bot className="h-[18px] w-[18px] text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            ChatBot Config
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
            Support that already knows your business.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Train an assistant on your own website and documents, embed it with one
            line of code, and let it answer around the clock.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              [Zap, "Live in under a minute from a single URL"],
              [Shield, "Answers grounded in your content, with sources"],
              [Check, "Hands off to your team when it can't help"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Zap;
              return (
                <li key={text as string} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <I className="h-3 w-3 text-white/80" />
                  </span>
                  <span className="text-sm leading-relaxed text-white/70">
                    {text as string}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-[13px] text-white/35">
          © {new Date().getFullYear()} ChatBot Config
        </p>
      </aside>

      {/* ---------------- Form panel ---------------- */}
      <main className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-[18px] w-[18px] text-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink-strong">
              ChatBot Config
            </span>
          </div>

          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-ink-strong">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {isSignUp
              ? "Start training your first assistant in minutes."
              : "Sign in to manage your chatbots."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="ds-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ds-input"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="ds-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ds-input"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="mt-1.5 text-[13px] text-ink-faint">
                  Use at least 6 characters.
                </p>
              )}
            </div>

            {message && (
              <div
                role="status"
                className={
                  isError
                    ? "rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
                    : "rounded-lg border border-positive/20 bg-positive-soft px-4 py-3 text-sm text-positive"
                }
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
                setIsError(false);
              }}
              className="text-sm text-ink-muted transition-colors hover:text-ink-strong"
            >
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-accent">Sign in</span>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <span className="font-semibold text-accent">Sign up</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-[13px] leading-relaxed text-ink-faint">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink-muted">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-muted">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
