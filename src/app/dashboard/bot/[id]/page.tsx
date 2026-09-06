"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Globe, Loader2, Link2, Code, Mail, MessageSquare } from "lucide-react";

export default function BotManagementPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"training" | "inbox" | "leads">("training");
  
  // Training State
  const [url, setUrl] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");

  // Inbox & Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<Record<string, any[]>>({});
  
  // Chat Tester State
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchData();
  }, [botId, activeTab]);

  const fetchData = async () => {
    // 1. Fetch Bot
    const { data: botData } = await supabase.from("chatbots").select("*").eq("id", botId).single();
    if (botData) setBot(botData);

    if (activeTab === "leads") {
      const { data: leadsData } = await supabase.from("leads").select("*").eq("bot_id", botId).order("captured_at", { ascending: false });
      if (leadsData) setLeads(leadsData);
    }

    if (activeTab === "inbox") {
      const { data: msgsData } = await supabase.from("chat_messages").select("*").eq("bot_id", botId).order("created_at", { ascending: true });
      if (msgsData) {
        // Group by session_id
        const grouped: Record<string, any[]> = {};
        msgsData.forEach(msg => {
          if (!grouped[msg.session_id]) grouped[msg.session_id] = [];
          grouped[msg.session_id].push(msg);
        });
        setChatSessions(grouped);
      }
    }
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsTraining(true);
    setTrainStatus("Scraping website... This may take up to a minute.");

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, websiteUrl: url }),
      });

      const data = await res.json();
      if (data.success) {
        setTrainStatus(`Success! Trained on ${data.chunksProcessed} data chunks across ${data.pagesScraped || 1} pages.`);
        setUrl("");
      } else {
        setTrainStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setTrainStatus("An error occurred during training.");
    } finally {
      setIsTraining(false);
    }
  };

  const handleTestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    const userMsg = testMessage.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setTestMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, message: userMsg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'bot', content: data.answer || "Error getting response." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', content: "Network error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!bot) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto h-screen flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{bot.name}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Link2 className="w-4 h-4" /> Manage your chatbot settings and data
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab("training")}
          className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'training' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Training & Integration
        </button>
        <button 
          onClick={() => setActiveTab("inbox")}
          className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'inbox' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inbox (Chat Logs)
        </button>
        <button 
          onClick={() => setActiveTab("leads")}
          className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'leads' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Captured Leads
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* TAB 1: TRAINING */}
        {activeTab === "training" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Train AI Model</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Enter a website URL. Our scraper will automatically crawl the page and up to 3 internal sub-pages to build your knowledge base.
                </p>
                <form onSubmit={handleTrain} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isTraining}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-blue-400 flex items-center"
                  >
                    {isTraining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Scrape & Train"}
                  </button>
                </form>
                {trainStatus && (
                  <p className={`mt-4 text-sm font-medium ${trainStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {trainStatus}
                  </p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold">Embed on Website</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Copy and paste this code into the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of your website.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-gray-300 text-sm overflow-x-auto whitespace-pre-wrap">
                    <code>
{`<script 
  src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/widget.js" 
  data-bot-id="${botId}" 
  defer>
</script>`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px] overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Test Chatbot</h2>
                <p className="text-sm text-gray-500">Test how the AI answers based on the training data.</p>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">Send a message to start testing</div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900 shadow-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-500 shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleTestChat} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: INBOX */}
        {activeTab === "inbox" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Chat Logs</h2>
              <p className="text-sm text-gray-500">Read the conversations your customers are having with the AI.</p>
            </div>
            <div className="p-6">
              {Object.keys(chatSessions).length === 0 ? (
                <p className="text-gray-500">No chat history found yet.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(chatSessions).map(([sessionId, msgs]) => (
                    <div key={sessionId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 text-xs font-mono text-gray-500">Session: {sessionId}</div>
                      <div className="p-4 space-y-3 bg-gray-50 max-h-[300px] overflow-y-auto">
                        {msgs.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-4 py-2 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-white border border-gray-200'}`}>
                              <span className="font-bold text-xs uppercase opacity-50 block mb-1">{msg.role}</span>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEADS */}
        {activeTab === "leads" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Mail className="w-5 h-5"/> Captured Leads</h2>
                <p className="text-sm text-gray-500">Emails captured by the widget during chat sessions.</p>
              </div>
              <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg">
                Total: {leads.length}
              </div>
            </div>
            
            {leads.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No leads captured yet. Once users enter their email in the widget, they will appear here.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email Address</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{lead.email}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(lead.captured_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
