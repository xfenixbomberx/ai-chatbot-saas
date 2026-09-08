"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Globe,
  FileText,
  Palette,
  Webhook,
  BarChart3,
  UserRoundCheck,
  Plus,
  Minus,
  Link2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    n: "01",
    icon: Link2,
    title: "Point it at your site",
    body: "Paste your URL. We crawl your pages, docs and FAQs, then split and index everything into a vector store built for retrieval.",
  },
  {
    n: "02",
    icon: Palette,
    title: "Make it yours",
    body: "Set the colour, icon and tone of voice. Upload PDFs for anything that isn't on the website — price lists, policies, manuals.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Drop in one line",
    body: "Copy a single script tag into your site. The widget is live, answering from your content, in under a minute.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant training",
    body: "Recursive crawling turns your whole site into an answerable knowledge base in seconds — no manual Q&A writing.",
  },
  {
    icon: Shield,
    title: "Grounded answers",
    body: "Responses are constrained to your indexed content and carry clickable source citations, so nothing gets invented.",
  },
  {
    icon: UserRoundCheck,
    title: "Human handoff",
    body: "When the bot can't resolve a query it pauses the thread and emails your team with the full conversation context.",
  },
  {
    icon: FileText,
    title: "Document upload",
    body: "Add PDFs alongside your site. Price lists, policy docs and manuals become part of the same knowledge base.",
  },
  {
    icon: BarChart3,
    title: "Lead capture & analytics",
    body: "Collect emails inside the conversation and see what customers actually ask about, in a live dashboard.",
  },
  {
    icon: Webhook,
    title: "Webhooks & integrations",
    body: "Fire captured leads straight into Zapier, Make or HubSpot the moment they land, with a POST to your endpoint.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "£49",
    tagline: "For a single site that needs coverage after hours.",
    features: ["1 AI chatbot", "Website crawling & training", "Lead capture", "Standard analytics", "Email support"],
    cta: "Start with Starter",
    featured: false,
  },
  {
    name: "Pro",
    price: "£99",
    tagline: "For teams running support across a few properties.",
    features: [
      "3 AI chatbots",
      "Unlimited retraining",
      "Custom branding & colours",
      "PDF document upload",
      "Live agent handoff",
      "Conversation analytics",
    ],
    cta: "Start with Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "£299",
    tagline: "For agencies and multi-brand deployments.",
    features: [
      "10 AI chatbots",
      "White-label — no watermark",
      "Webhooks & CRM integrations",
      "Dedicated account manager",
      "Priority support",
    ],
    cta: "Start with Enterprise",
    featured: false,
  },
];

const FAQS = [
  {
    q: "How long does setup actually take?",
    a: "Most sites are crawled, indexed and live within a couple of minutes. You paste a URL, wait for training to finish, then copy one script tag into your page template. No engineering ticket required.",
  },
  {
    q: "What stops it from making things up?",
    a: "The bot answers only from content retrieved out of your own index. If the retrieval step finds nothing relevant, it says so and offers to pass the question to a human rather than guessing. Answers link back to the page they came from.",
  },
  {
    q: "What happens when it can't answer?",
    a: "The conversation is flagged, the thread pauses, and your team gets an email with the full transcript so a person can pick it up. Nothing silently disappears.",
  },
  {
    q: "Can I add content that isn't on my website?",
    a: "Yes. Upload PDFs — price lists, policy documents, product manuals — and they're indexed alongside the crawled pages as part of the same knowledge base.",
  },
  {
    q: "Does it match my brand?",
    a: "You control the accent colour, launcher icon and greeting. On Enterprise the “powered by” watermark is removed entirely, so the widget reads as native to your site.",
  },
  {
    q: "Can I cancel whenever I want?",
    a: "Yes. Billing runs through Stripe and you can cancel or change plan from the customer portal in your dashboard at any time. No contracts, no exit fees.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white font-sans text-ink">
      <SiteNav />
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <Features />
      <Pricing />
      <Faq openFaq={openFaq} setOpenFaq={setOpenFaq} />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------- Nav --------------------------- */

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/85 backdrop-blur-xl">
      <div className="ds-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-[0_2px_8px_rgba(79,70,229,0.28)]">
            <Bot className="h-[18px] w-[18px] text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-strong">
            ChatBot Config
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["How it works", "#how"],
            ["Features", "#features"],
            ["Pricing", "#pricing"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-strong sm:block"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-ink-strong px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- Hero --------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="ds-grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />

      <div className="ds-container relative pt-20 pb-24 text-center md:pt-28">
        <motion.a
          href="#features"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-muted shadow-[var(--shadow-xs)] transition-colors hover:border-line-strong hover:text-ink-strong"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-positive" />
          Live agent handoff & webhooks now available
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mx-auto mt-8 max-w-4xl text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink-strong sm:text-6xl lg:text-[4.25rem]"
        >
          Customer support that
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-accent to-[#7c6cf5] bg-clip-text text-transparent">
            already knows your business
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl"
        >
          Train an AI assistant on your own website and documents, embed it with one
          line of code, and let it answer customers around the clock — with sources,
          not guesses.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/login"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-white shadow-[var(--shadow-accent)] transition-all hover:bg-accent-hover hover:shadow-[0_10px_30px_rgba(79,70,229,0.3)] sm:w-auto"
          >
            Start building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex w-full items-center justify-center rounded-xl border border-line-strong bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-strong shadow-[var(--shadow-xs)] transition-colors hover:bg-surface-muted sm:w-auto"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-5 text-[13px] text-ink-faint"
        >
          No engineering required · Cancel any time · Secure Stripe billing
        </motion.p>

        <ProductMockup />
      </div>
    </section>
  );
}

/* ------------------------------ Mockup ---------------------------- */

function ProductMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative mx-auto mt-20 max-w-5xl"
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xl)]">
        {/* Browser chrome */}
        <div className="flex h-11 items-center gap-2 border-b border-line bg-surface-muted px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <div className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1 font-mono text-[11px] text-ink-muted">
            <Globe className="h-3 w-3" />
            chatbotconfig.uk
          </div>
        </div>

        {/* Body */}
        <div className="relative grid grid-cols-1 md:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <div className="hidden border-r border-line bg-surface-muted/60 p-4 md:block">
            <div className="mb-4 h-7 rounded-md border border-line bg-white shadow-[var(--shadow-xs)]" />
            <div className="space-y-2">
              <div className="h-7 rounded-md bg-accent-soft" />
              <div className="h-7 rounded-md bg-line/70" />
              <div className="h-7 w-4/5 rounded-md bg-line/70" />
              <div className="h-7 w-3/5 rounded-md bg-line/70" />
            </div>
            <div className="mt-8 space-y-2">
              <div className="h-3 w-1/2 rounded bg-line/70" />
              <div className="h-3 w-2/3 rounded bg-line/70" />
            </div>
          </div>

          {/* Conversation */}
          <div className="ds-dots min-h-[340px] space-y-4 p-6 md:p-8">
            <div className="flex justify-end">
              <p className="max-w-sm rounded-2xl rounded-tr-md bg-accent px-4 py-3 text-sm leading-relaxed text-white shadow-[var(--shadow-sm)]">
                Do you ship to Ireland, and how long does it take?
              </p>
            </div>
            <div className="flex justify-start">
              <div className="max-w-md rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink shadow-[var(--shadow-sm)]">
                Yes — we ship to Ireland with tracked delivery, typically 3–5
                working days. Orders over £75 ship free.
                <span className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-accent">
                  <FileText className="h-3.5 w-3.5" />
                  Source: /shipping-and-returns
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <p className="max-w-sm rounded-2xl rounded-tr-md bg-accent px-4 py-3 text-sm leading-relaxed text-white shadow-[var(--shadow-sm)]">
                Can I speak to someone about a bulk order?
              </p>
            </div>
            <div className="flex justify-start">
              <div className="max-w-md rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink shadow-[var(--shadow-sm)]">
                Of course — I&apos;ve passed this to the team and they&apos;ll reply by
                email shortly.
                <span className="mt-3 flex w-fit items-center gap-1.5 rounded-md bg-positive-soft px-2 py-1 text-[12px] font-medium text-positive">
                  <UserRoundCheck className="h-3.5 w-3.5" />
                  Handed off to a human
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade the bottom into the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </motion.div>
  );
}

/* ------------------------------ Proof ----------------------------- */

function ProofStrip() {
  const items = [
    ["Under a minute", "From pasted URL to a live widget"],
    ["24/7", "Coverage without adding headcount"],
    ["Every answer cited", "Linked back to your own pages"],
    ["One line of code", "No framework or plugin required"],
  ];

  return (
    <section className="border-b border-line bg-surface-muted">
      <div className="ds-container grid grid-cols-2 gap-x-8 gap-y-8 py-12 lg:grid-cols-4">
        {items.map(([stat, label]) => (
          <div key={stat}>
            <p className="text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
              {stat}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink-muted">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- How it works ------------------------- */

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-strong sm:text-[2.5rem] sm:leading-[1.12]">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-b border-line py-24">
      <div className="ds-container">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, one afternoon at most"
          body="No prompt engineering, no training data to assemble, no plugin to install. Your website is the knowledge base."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="group relative rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm text-ink-faint">{step.n}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink-strong">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* Embed snippet */}
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border border-line bg-[#0f1218] shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
              index.html
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/60">
              1 line
            </span>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-white/85">
            <code>
              <span className="text-white/40">&lt;</span>
              <span className="text-[#7dd3fc]">script</span>{" "}
              <span className="text-[#c4b5fd]">src</span>
              <span className="text-white/40">=</span>
              <span className="text-[#86efac]">&quot;https://chatbotconfig.uk/widget-v2.js&quot;</span>{" "}
              <span className="text-[#c4b5fd]">data-bot-id</span>
              <span className="text-white/40">=</span>
              <span className="text-[#86efac]">&quot;your-bot-id&quot;</span>{" "}
              <span className="text-[#c4b5fd]">async</span>
              <span className="text-white/40">&gt;&lt;/</span>
              <span className="text-[#7dd3fc]">script</span>
              <span className="text-white/40">&gt;</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Features -------------------------- */

function Features() {
  return (
    <section id="features" className="border-b border-line bg-surface-muted py-24">
      <div className="ds-container">
        <SectionHeading
          eyebrow="Features"
          title="Everything the support inbox was doing"
          body="Built for the questions customers actually ask — and honest about the ones it can't answer."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white p-8 transition-colors hover:bg-surface-muted/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-muted text-accent transition-colors group-hover:border-accent/30 group-hover:bg-accent-soft">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-[17px] font-semibold text-ink-strong">
                {f.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Pricing --------------------------- */

function Pricing() {
  return (
    <section id="pricing" className="border-b border-line py-24">
      <div className="ds-container">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, no per-message surprises"
          body="Every plan includes training, lead capture and the embeddable widget. Upgrade or cancel from your dashboard whenever you like."
        />

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "relative rounded-2xl border-2 border-accent bg-white p-8 shadow-[var(--shadow-lg)] lg:-mt-4 lg:pb-10"
                  : "relative rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-xs)]"
              }
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-ink-strong">{plan.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {plan.tagline}
              </p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-ink-strong">
                  {plan.price}
                </span>
                <span className="text-sm font-medium text-ink-muted">/month</span>
              </p>

              <Link
                href="/login"
                className={
                  plan.featured
                    ? "mt-7 flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover"
                    : "mt-7 flex w-full items-center justify-center rounded-xl border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted"
                }
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 space-y-3 border-t border-line pt-7">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[15px] text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-muted">
          Prices in GBP, billed monthly through Stripe. VAT added where applicable.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------- FAQ ----------------------------- */

function Faq({
  openFaq,
  setOpenFaq,
}: {
  openFaq: number | null;
  setOpenFaq: (i: number | null) => void;
}) {
  return (
    <section id="faq" className="border-b border-line bg-surface-muted py-24">
      <div className="ds-container">
        <SectionHeading
          eyebrow="FAQ"
          title="The questions we get asked most"
          body="Anything else, the support bot on this page is trained on exactly this content — ask it."
        />

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-surface-muted/60"
                >
                  <span className="text-[15px] font-semibold text-ink-strong">
                    {item.q}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted">
                    {open ? (
                      <Minus className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
                {open && (
                  <p className="px-6 pb-6 -mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Final CTA ------------------------- */

function FinalCta() {
  return (
    <section className="border-b border-line py-24">
      <div className="ds-container">
        <div className="relative overflow-hidden rounded-3xl bg-[#0f1218] px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-accent/25 blur-[110px]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[2.5rem] sm:leading-[1.12]">
              Put your website to work answering customers
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/60">
              Train your first assistant in minutes. Cancel any time.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-strong transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Create your account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Compare plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Footer --------------------------- */

function SiteFooter() {
  return (
    <footer className="bg-white py-14">
      <div className="ds-container">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Bot className="h-[18px] w-[18px] text-white" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink-strong">
                ChatBot Config
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Custom-trained AI assistants that answer from your own content and
              hand off to your team when it matters.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                ["How it works", "#how"],
                ["Features", "#features"],
                ["Pricing", "#pricing"],
                ["FAQ", "#faq"],
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                ["Log in", "/login"],
                ["Sign up", "/login"],
                ["Dashboard", "/dashboard"],
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                ["Privacy policy", "/privacy"],
                ["Terms of service", "/terms"],
              ]}
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-[13px] text-ink-faint">
            © {new Date().getFullYear()} ChatBot Config. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-[13px] text-ink-faint">
            <MessageSquare className="h-3.5 w-3.5" />
            Built in the UK
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-strong">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label + href}>
            <Link
              href={href}
              className="text-sm text-ink-muted transition-colors hover:text-ink-strong"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
