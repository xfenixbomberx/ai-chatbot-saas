"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Link2,
  Code,
  Mail,
  MessageSquare,
  Download,
  Settings,
  Users,
  ShieldCheck,
  User,
  Save,
  Bot,
  Check,
  Copy,
  Send,
  AlertTriangle,
  Upload,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SITE = "https://www.chatbotconfig.uk";

const TABS = [
  { id: "training", label: "Training" },
  { id: "test", label: "Test chatbot" },
  { id: "inbox", label: "Conversations" },
  { id: "leads", label: "Leads" },
  { id: "settings", label: "Integrations" },
] as const;

const PERSONAS = [
  {
    label: "Friendly",
    prompt:
      "You are a warm, friendly, and helpful customer support agent. Answer questions using the website context.",
  },
  {
    label: "Technical",
    prompt:
      "You are a highly technical, precise, and concise expert. Answer the questions directly using the provided context.",
  },
  {
    label: "Sales",
    prompt:
      "You are an aggressive but polite sales closer. Answer the user's question, but always subtly pivot to encourage them to buy.",
  },
  {
    label: "Pirate",
    prompt:
      "You are a grumpy pirate. Always respond like a pirate looking for treasure, using pirate slang.",
  },
];

export default function BotManagementPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [activeTab, setActiveTab] =
    useState<"training" | "test" | "inbox" | "leads" | "settings">("training");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#4f46e5");
  const [editIcon, setEditIcon] = useState("bot");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");

  // Premium settings
  const [webhookUrl, setWebhookUrl] = useState("");
  const [removeBranding, setRemoveBranding] = useState(false);
  const [isSavingPremium, setIsSavingPremium] = useState(false);

  // Training
  const [url, setUrl] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Persona
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptStatus, setPromptStatus] = useState("");

  // Data (paginated -- these tabs used to fetch entire tables unbounded)
  const LEADS_PAGE_SIZE = 50;
  const MESSAGES_PAGE_SIZE = 200;
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsTotalCount, setLeadsTotalCount] = useState(0);
  const [leadsHasMore, setLeadsHasMore] = useState(false);
  const [isLoadingMoreLeads, setIsLoadingMoreLeads] = useState(false);
  const [chatSessions, setChatSessions] = useState<Record<string, any[]>>({});
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Tester
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string; citation?: string; isHandoff?: boolean }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveAgentMode, setIsLiveAgentMode] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, activeTab]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchData = async () => {
    const { data: botData } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", botId)
      .single();

    if (botData) {
      setBot(botData);
      setEditName(botData.name);
      setEditColor(botData.primary_color || "#4f46e5");
      setEditIcon(botData.icon || "bot");
      setCustomPrompt(botData.system_prompt || "");
      if (botData.webhook_url) setWebhookUrl(botData.webhook_url);
      if (botData.remove_branding) setRemoveBranding(botData.remove_branding);
      if (botData.website_url) {
        setUrl((prev) => (prev ? prev : botData.website_url));
      }
    }

    if (activeTab === "leads" || activeTab === "inbox") {
      // Bounded first page instead of the entire table -- these tabs used to
      // fetch every row unconditionally, which grows unbounded with usage.
      const { data: leadsData, count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("bot_id", botId)
        .order("captured_at", { ascending: false })
        .range(0, LEADS_PAGE_SIZE - 1);
      if (leadsData) {
        setLeads(leadsData);
        setLeadsTotalCount(leadsCount ?? leadsData.length);
        setLeadsHasMore((leadsCount ?? 0) > leadsData.length);
      }

      // Most recent page, newest first, then reversed so sessions render
      // chronologically -- same effect as the old ascending-order fetch for
      // the common case (a session's messages fit within one page).
      const { data: msgsDesc, count: msgsCount } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact" })
        .eq("bot_id", botId)
        .order("created_at", { ascending: false })
        .range(0, MESSAGES_PAGE_SIZE - 1);

      if (msgsDesc) {
        const msgsData = [...msgsDesc].reverse();
        setMessagesHasMore((msgsCount ?? 0) > msgsDesc.length);
        groupMessagesIntoSessions(msgsData);
        computeChartData(msgsData, leadsData || []);
      }
    }
  };

  const groupMessagesIntoSessions = (msgsData: any[]) => {
    const grouped: Record<string, any[]> = {};
    msgsData.forEach((msg) => {
      if (!grouped[msg.session_id]) grouped[msg.session_id] = [];
      grouped[msg.session_id].push(msg);
    });
    setChatSessions(grouped);
  };

  const computeChartData = (msgsData: any[], leadsData: any[]) => {
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    const chartAgg = last7Days.map((date) => {
      const msgsOnDate = msgsData.filter((m) => m.created_at.startsWith(date)).length;
      const leadsOnDate = leadsData.filter((l) => (l.captured_at || "").startsWith(date)).length;
      return { name: date.slice(5), Messages: msgsOnDate, Leads: leadsOnDate };
    });
    setChartData(chartAgg);
  };

  const loadMoreLeads = async () => {
    setIsLoadingMoreLeads(true);
    const { data, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("bot_id", botId)
      .order("captured_at", { ascending: false })
      .range(leads.length, leads.length + LEADS_PAGE_SIZE - 1);

    if (data) {
      const merged = [...leads, ...data];
      setLeads(merged);
      setLeadsTotalCount(count ?? merged.length);
      setLeadsHasMore((count ?? 0) > merged.length);
    }
    setIsLoadingMoreLeads(false);
  };

  const loadMoreMessages = async () => {
    setIsLoadingMoreMessages(true);
    const alreadyLoaded = Object.values(chatSessions).reduce((n, m) => n + m.length, 0);

    // Next page going further back in time -- still newest-first, then
    // reversed and prepended so the merged set stays chronological.
    const { data, count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact" })
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })
      .range(alreadyLoaded, alreadyLoaded + MESSAGES_PAGE_SIZE - 1);

    if (data) {
      const currentAll = Object.values(chatSessions).flat();
      const merged = [...data.reverse(), ...currentAll];
      setMessagesHasMore((count ?? 0) > alreadyLoaded + data.length);
      groupMessagesIntoSessions(merged);
    }
    setIsLoadingMoreMessages(false);
  };

  // Exports pull the complete dataset directly, independent of whatever
  // page is currently on screen -- leads/messages are business records
  // people rely on the export being complete.
  const fetchAllRows = async (table: "leads" | "chat_messages", orderCol: string) => {
    const rows: any[] = [];
    const BATCH = 1000;
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("bot_id", botId)
        .order(orderCol, { ascending: true })
        .range(offset, offset + BATCH - 1);
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < BATCH) break;
      offset += BATCH;
    }
    return rows;
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url.trim();
    if (
      formattedUrl &&
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    setIsTraining(true);
    setUploadStatus("");
    setTrainStatus("Training… this can take a few minutes on larger sites.");

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, websiteUrl: formattedUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setTrainStatus(
          `Trained on ${data.chunksProcessed} chunks across ${data.pagesScraped || 1} page(s).`
        );
      } else {
        setTrainStatus(`Error: ${data.error}`);
      }
    } catch {
      setTrainStatus("Error: something went wrong during training.");
    } finally {
      setIsTraining(false);
    }
  };

  const handleTestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    const userMsg = testMessage.trim();
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setTestMessage("");
    setIsTyping(true);

    try {
      const testSessionId = `test-dashboard-${botId.substring(0, 6)}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, message: userMsg, sessionId: testSessionId }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.answer || "Error getting response.",
          citation: data.citation,
          isHandoff: data.isHandoff,
        },
      ]);
      if (data.isHandoff) setIsLiveAgentMode(true);
    } catch {
      setChatHistory((prev) => [...prev, { role: "bot", content: "Network error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    setPromptStatus("");
    try {
      const { error } = await supabase
        .from("chatbots")
        .update({ system_prompt: customPrompt })
        .eq("id", botId);
      if (error) throw error;
      setPromptStatus("Persona saved.");
      setTimeout(() => setPromptStatus(""), 3000);
    } catch {
      setPromptStatus("Error saving persona.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSavePremiumSettings = async () => {
    setIsSavingPremium(true);
    try {
      const { error } = await supabase
        .from("chatbots")
        .update({ webhook_url: webhookUrl, remove_branding: removeBranding })
        .eq("id", botId);
      if (error) throw error;
      alert("Integration settings saved.");
    } catch {
      alert(
        "Please ensure the 'webhook_url' (text) and 'remove_branding' (boolean) columns exist in your Supabase 'chatbots' table."
      );
    } finally {
      setIsSavingPremium(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTrainStatus("");
    setUploadStatus("Uploading and parsing document…");

    const formData = new FormData();
    formData.append("botId", botId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`Trained on ${data.chunksProcessed} chunks from the document.`);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch {
      setUploadStatus("Error uploading file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportCSV = async () => {
    if (leads.length === 0) return;
    setIsExporting(true);
    try {
      const allLeads = await fetchAllRows("leads", "captured_at");
      const header = "Email,Date Captured\n";
      const csv = allLeads
        .map((l) => `${l.email},${new Date(l.captured_at).toISOString()}`)
        .join("\n");
      const blob = new Blob([header + csv], { type: "text/csv" });
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `leads-${botId}.csv`;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateBot = async () => {
    setIsUpdating(true);
    setUpdateStatus("");
    const { error } = await supabase
      .from("chatbots")
      .update({ name: editName, primary_color: editColor, icon: editIcon })
      .eq("id", botId);

    if (error) {
      setUpdateStatus("Error updating bot details.");
    } else {
      setUpdateStatus("Appearance saved.");
      setBot((prev: any) => ({
        ...prev,
        name: editName,
        primary_color: editColor,
        icon: editIcon,
      }));
      setTimeout(() => setUpdateStatus(""), 3000);
    }
    setIsUpdating(false);
  };

  const embedSnippet = `<script src="${SITE}/widget-v2.js" data-bot-id="${botId}"></script>`;

  const sessionCount = Object.keys(chatSessions).length;
  const deflection =
    sessionCount > 0
      ? Math.round(
          ((sessionCount -
            Object.values(chatSessions).filter((session) =>
              session.some(
                (msg) =>
                  msg.role === "bot" && msg.content.includes("alerted our human team")
              )
            ).length) /
            sessionCount) *
            100
        )
      : 100;

  if (!bot) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chatbot…
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-1 rounded-lg border border-line bg-white p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-strong"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-white"
            style={{ backgroundColor: bot.primary_color || "#4f46e5" }}
          >
            {bot.name?.charAt(0)?.toUpperCase()}
          </span>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
              {bot.name}
            </h1>
            {bot.website_url && (
              <a
                href={bot.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-[13px] text-ink-muted transition-colors hover:text-accent"
              >
                <Globe className="h-3.5 w-3.5" />
                {bot.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-line">
          <div className="ds-scrollbar -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? "whitespace-nowrap border-b-2 border-accent px-4 py-3 text-sm font-semibold text-accent"
                    : "whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink-strong"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {/* ------------------------- TRAINING ------------------------- */}
          {activeTab === "training" && (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {/* Knowledge base */}
              <Card
                icon={<Globe className="h-[18px] w-[18px]" />}
                title="Knowledge base"
                subtitle="Crawl a website or upload a document to train this bot."
              >
                <form onSubmit={handleTrain} className="space-y-3">
                  <div>
                    <label className="ds-label">Website URL</label>
                    <input
                      type="text"
                      placeholder="www.example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="ds-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTraining}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isTraining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Training…
                      </>
                    ) : (
                      "Train from website"
                    )}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    or
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface-muted px-4 py-3 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-sunken disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload a PDF, text file or image
                </button>

                <StatusNote text={trainStatus || uploadStatus} />
              </Card>

              {/* Appearance */}
              <Card
                icon={<Settings className="h-[18px] w-[18px]" />}
                title="Identity & appearance"
                subtitle="How the widget presents itself on your site."
              >
                <div className="space-y-4">
                  <div>
                    <label className="ds-label">Bot name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="ds-input"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="ds-label">Widget icon</label>
                      <select
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="ds-input h-[42px]"
                      >
                        <option value="bot">Robot</option>
                        <option value="message">Message bubble</option>
                        <option value="sparkles">Sparkles</option>
                        <option value="support">Life saver</option>
                        <option value="chat">Double chat</option>
                        <option value="magic">Magic wand</option>
                        <option value="smile">Smiley face</option>
                      </select>
                    </div>
                    <div>
                      <label className="ds-label">Brand colour</label>
                      <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-white p-1.5">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-[13px] uppercase text-ink-muted">
                          {editColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateBot}
                    disabled={isUpdating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-60"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save appearance"}
                  </button>
                  <StatusNote text={updateStatus} />
                </div>
              </Card>

              {/* Persona */}
              <Card
                icon={<Bot className="h-[18px] w-[18px]" />}
                title="Persona"
                subtitle="Instructions that shape how the AI answers."
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setCustomPrompt(p.prompt)}
                      className="rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="You are a friendly support bot…"
                  rows={6}
                  className="ds-input resize-none text-[13px]"
                />
                <button
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-60"
                >
                  {isSavingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save persona"}
                </button>
                <StatusNote text={promptStatus} />
              </Card>

              {/* Embed */}
              <Card
                icon={<Code className="h-[18px] w-[18px]" />}
                title="Embed on your website"
                subtitle="Paste this just before the closing </body> tag."
              >
                <div className="overflow-hidden rounded-lg border border-line bg-[#0f1218]">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                      Snippet
                    </span>
                    <button
                      onClick={() => copy(embedSnippet, "embed")}
                      className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/20"
                    >
                      {copied === "embed" ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto px-4 py-3">
                    <code className="font-mono text-[12px] leading-relaxed text-white/85">
                      {embedSnippet}
                    </code>
                  </pre>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-surface-muted px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink-strong">
                      Shareable demo page
                    </p>
                    <p className="mt-0.5 font-mono text-[12px] text-ink-muted">
                      /demo/{botId.substring(0, 8)}…
                    </p>
                  </div>
                  <button
                    onClick={() => copy(`${SITE}/demo/${botId}`, "demo")}
                    className="shrink-0 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-strong transition-colors hover:bg-surface-muted"
                  >
                    {copied === "demo" ? "Copied" : "Copy link"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* --------------------------- TEST --------------------------- */}
          {activeTab === "test" && (
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between border-b border-line bg-surface-muted px-6 py-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink-strong">
                    Test chatbot
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Check how it answers from the current training data.
                  </p>
                </div>
                <button
                  onClick={() => setChatHistory([])}
                  className="rounded-lg border border-line-strong bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-strong transition-colors hover:bg-surface-muted"
                >
                  Clear
                </button>
              </div>

              <div className="ds-dots ds-scrollbar h-[440px] space-y-4 overflow-y-auto p-6">
                {chatHistory.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                      <MessageSquare className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-[15px] font-medium text-ink-strong">
                      Send a message to start testing
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Try a question a real customer would ask.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-accent px-4 py-2.5 text-sm leading-relaxed text-white shadow-[var(--shadow-sm)]"
                            : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-sm leading-relaxed text-ink shadow-[var(--shadow-sm)]"
                        }
                      >
                        {msg.content}
                      </div>
                      {msg.citation && (
                        <a
                          href={msg.citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-ink-muted transition-colors hover:text-accent"
                        >
                          <Link2 className="h-3 w-3" />
                          Source
                        </a>
                      )}
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-sm text-ink-muted shadow-[var(--shadow-sm)] w-fit">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Typing…
                  </div>
                )}
              </div>

              {isLiveAgentMode ? (
                <div className="flex flex-col items-center gap-2 border-t border-warning/20 bg-warning-soft px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Live agent handoff triggered
                  </span>
                  <p className="text-[13px] text-warning/80">
                    The AI has paused and an email has been sent to your team.
                  </p>
                  <button
                    onClick={() => {
                      setIsLiveAgentMode(false);
                      setChatHistory([]);
                    }}
                    className="mt-2 rounded-lg bg-warning px-3.5 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Restart session
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleTestChat}
                  className="flex gap-2 border-t border-line bg-white p-4"
                >
                  <input
                    type="text"
                    placeholder="Ask a question…"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="ds-input flex-1"
                  />
                  <button
                    type="submit"
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </form>
              )}
            </div>
          )}

          {/* --------------------------- INBOX -------------------------- */}
          {activeTab === "inbox" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Conversations"
                  value={sessionCount}
                  icon={<MessageSquare className="h-[18px] w-[18px]" />}
                />
                <Stat
                  label="Leads captured"
                  value={leadsTotalCount}
                  icon={<Users className="h-[18px] w-[18px]" />}
                />
                <Stat
                  label="Resolved without a human"
                  value={`${deflection}%`}
                  icon={<ShieldCheck className="h-[18px] w-[18px]" />}
                  accent
                />
              </div>

              <div className="rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-xs)]">
                <h2 className="text-[15px] font-semibold text-ink-strong">
                  Last 7 days
                </h2>
                <div className="mt-6 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e8ee" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7484", fontSize: 12 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7484", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #e6e8ee",
                          boxShadow: "0 12px 32px rgba(11,14,20,0.08)",
                          fontSize: 13,
                        }}
                        labelStyle={{ color: "#0b0e14", fontWeight: 600 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Messages"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: "#4f46e5" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Leads"
                        stroke="#0f8a5f"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: "#0f8a5f" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-muted px-6 py-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink-strong">
                      Recent conversations
                    </h2>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      Exactly how the AI handled each customer query.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsExporting(true);
                      try {
                        const allMsgs = await fetchAllRows("chat_messages", "created_at");
                        const csvContent =
                          "data:text/csv;charset=utf-8,Session ID,Role,Message\n" +
                          allMsgs
                            .map(
                              (m) => `${m.session_id},${m.role},"${m.content.replace(/"/g, '""')}"`
                            )
                            .join("\n");
                        const link = document.createElement("a");
                        link.setAttribute("href", encodeURI(csvContent));
                        link.setAttribute("download", `chat_logs_${botId}.csv`);
                        document.body.appendChild(link);
                        link.click();
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={sessionCount === 0 || isExporting}
                    className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export logs
                  </button>
                </div>

                {sessionCount === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-7 w-7" />}
                    title="No conversations yet"
                    body="Once visitors start chatting with your widget, transcripts appear here."
                  />
                ) : (
                  <div className="divide-y divide-line">
                    {Object.entries(chatSessions).map(([sessionId, msgs]) => (
                      <div key={sessionId} className="p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                            <User className="h-[18px] w-[18px]" />
                          </span>
                          <div>
                            <p className="font-mono text-[13px] font-medium text-ink-strong">
                              {sessionId.substring(0, 8)}…
                            </p>
                            <p className="text-[12px] text-ink-muted">
                              {msgs.length} message{msgs.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <div className="ds-scrollbar max-h-[300px] space-y-3 overflow-y-auto rounded-xl border border-line bg-surface-muted p-4">
                          {msgs.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={
                                  msg.role === "user"
                                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-relaxed text-white"
                                    : "max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-white px-4 py-2.5 text-sm leading-relaxed text-ink"
                                }
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {messagesHasMore && (
                  <div className="border-t border-line p-4 text-center">
                    <button
                      onClick={loadMoreMessages}
                      disabled={isLoadingMoreMessages}
                      className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-50"
                    >
                      {isLoadingMoreMessages && <Loader2 className="h-4 w-4 animate-spin" />}
                      Load more
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------- LEADS -------------------------- */}
          {activeTab === "leads" && (
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-muted px-6 py-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink-strong">
                    Captured leads
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Emails collected inside conversations.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink">
                    {leadsTotalCount} total
                  </span>
                  <button
                    onClick={handleExportCSV}
                    disabled={leads.length === 0 || isExporting}
                    className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export CSV
                  </button>
                </div>
              </div>

              {leads.length === 0 ? (
                <EmptyState
                  icon={<Mail className="h-7 w-7" />}
                  title="No leads yet"
                  body="When a visitor shares their email in the widget, they'll show up here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-line bg-surface-muted">
                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                          Email address
                        </th>
                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                          Captured
                        </th>
                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {leads.map((lead) => {
                        const when = lead.captured_at || lead.created_at;
                        return (
                          <tr key={lead.id} className="transition-colors hover:bg-surface-muted/60">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[13px] font-semibold text-accent-ink">
                                  {lead.email.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-ink-strong">
                                  {lead.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-ink-muted">
                              {when
                                ? new Date(when).toLocaleDateString("en-GB", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2.5 py-1 text-[12px] font-semibold text-positive">
                                <Check className="h-3 w-3" />
                                Captured
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {leadsHasMore && (
                    <div className="border-t border-line p-4 text-center">
                      <button
                        onClick={loadMoreLeads}
                        disabled={isLoadingMoreLeads}
                        className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-muted disabled:opacity-50"
                      >
                        {isLoadingMoreLeads && <Loader2 className="h-4 w-4 animate-spin" />}
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------- INTEGRATIONS --------------------- */}
          {activeTab === "settings" && (
            <div className="max-w-2xl overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
              <div className="border-b border-line bg-surface-muted px-6 py-4">
                <h2 className="text-[15px] font-semibold text-ink-strong">
                  Integrations & white-label
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  Connect this bot to the rest of your stack.
                </p>
              </div>

              <div className="divide-y divide-line">
                <div className="p-6">
                  <label className="ds-label">Webhook URL</label>
                  <p className="mb-3 text-[13px] text-ink-muted">
                    We fire a POST request to this URL whenever a lead is captured —
                    works with Zapier, Make and HubSpot.
                  </p>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/…"
                    className="ds-input font-mono text-[13px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-6 p-6">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-strong">
                      Remove branding
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                      Hide the “Powered by ChatBot Config” watermark on your widget.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={removeBranding}
                    onClick={() => setRemoveBranding(!removeBranding)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      removeBranding ? "bg-accent" : "bg-line-strong"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform ${
                        removeBranding ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-end bg-surface-muted px-6 py-4">
                  <button
                    onClick={handleSavePremiumSettings}
                    disabled={isSavingPremium}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isSavingPremium ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Small building blocks ------------------------ */

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-xs)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          {icon}
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink-strong">{title}</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusNote({ text }: { text: string }) {
  if (!text) return null;
  const isError = text.toLowerCase().includes("error");
  return (
    <p
      className={
        isError
          ? "mt-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger"
          : "mt-3 rounded-lg border border-positive/20 bg-positive-soft px-3 py-2 text-[13px] text-positive"
      }
    >
      {text}
    </p>
  );
}

function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-accent/25 bg-accent-soft p-5"
          : "rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]"
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <span
          className={
            accent
              ? "flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-accent"
              : "flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-muted"
          }
        >
          {icon}
        </span>
      </div>
      <p
        className={
          accent
            ? "mt-4 text-3xl font-semibold tracking-tight text-accent-ink"
            : "mt-4 text-3xl font-semibold tracking-tight text-ink-strong"
        }
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="px-8 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-faint">
        {icon}
      </span>
      <h3 className="mt-5 text-[15px] font-semibold text-ink-strong">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        {body}
      </p>
    </div>
  );
}
