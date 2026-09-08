import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="min-h-screen bg-surface-muted font-sans">
      {/* Slim header */}
      <header className="border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="ds-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-[18px] w-[18px] text-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink-strong">
              ChatBot Config
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="ds-container py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink-strong">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-line bg-surface-muted px-8 py-4">
              <p className="text-sm text-ink-muted">
                Last updated{" "}
                <time className="font-medium text-ink-strong">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </p>
            </div>

            <div className="divide-y divide-line">
              {sections.map((section, i) => (
                <section key={section.heading} className="px-8 py-7">
                  <h2 className="flex gap-3 text-[17px] font-semibold text-ink-strong">
                    <span className="font-mono text-sm text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </h2>
                  <p className="mt-3 pl-9 text-[15px] leading-relaxed text-ink-muted">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-5">
            <p className="text-sm text-ink-muted">
              Questions about this document?
            </p>
            <a
              href="mailto:legal@chatbotconfig.uk"
              className="text-sm font-semibold text-accent hover:text-accent-hover"
            >
              legal@chatbotconfig.uk
            </a>
          </div>

          <div className="mt-8 flex gap-6 text-sm">
            <Link href="/privacy" className="text-ink-muted hover:text-ink-strong">
              Privacy policy
            </Link>
            <Link href="/terms" className="text-ink-muted hover:text-ink-strong">
              Terms of service
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
