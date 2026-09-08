"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Globe, Loader2, Link2, Code, Mail, MessageSquare, FileText, Download, Settings, TrendingUp, Users, ShieldCheck, User, Save, Bot } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BotManagementPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"training" | "test" | "inbox" | "leads" | "settings">("training");
  
  // Edit State
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#2563eb");
  const [editIcon, setEditIcon] = useState("bot");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");

  // Premium Settings State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [removeBranding, setRemoveBranding] = useState(false);
  const [isSavingPremium, setIsSavingPremium] = useState(false);

  // Training State
  const [url, setUrl] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");
  
  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Custom Persona State
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptStatus, setPromptStatus] = useState("");

  // Inbox & Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<Record<string, any[]>>({});
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Chat Tester State
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string, citation?: string, isHandoff?: boolean}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveAgentMode, setIsLiveAgentMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [botId, activeTab]);

  const fetchData = async () => {
    // 1. Fetch Bot
    const { data: botData } = await supabase.from("chatbots").select("*").eq("id", botId).single();
    if (botData) {
      setBot(botData);
      setEditName(botData.name);
      setEditColor(botData.primary_color || "#2563eb");
      setEditIcon(botData.icon || "bot");
      setCustomPrompt(botData.system_prompt || "");
      if (botData.webhook_url) setWebhookUrl(botData.webhook_url);
      if (botData.remove_branding) setRemoveBranding(botData.remove_branding);
      if (botData.website_url) {
        // Pre-fill the scraper input with their website so they don't have to type it again
        setUrl(prev => prev ? prev : botData.website_url);
      }
    }

    if (activeTab === "leads" || activeTab === "inbox") {
      const { data: leadsData } = await supabase.from("leads").select("*").eq("bot_id", botId).order("captured_at", { ascending: false });
      if (leadsData) setLeads(leadsData);

      const { data: msgsData } = await supabase.from("chat_messages").select("*").eq("bot_id", botId).order("created_at", { ascending: true });
      if (msgsData) {
        // Group by session_id
        const grouped: Record<string, any[]> = {};
        msgsData.forEach(msg => {
          if (!grouped[msg.session_id]) grouped[msg.session_id] = [];
          grouped[msg.session_id].push(msg);
        });
        setChatSessions(grouped);
        
        // Build 7-day analytics chart data
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const chartAgg = last7Days.map(date => {
          const msgsOnDate = msgsData.filter(m => m.created_at.startsWith(date)).length;
          const leadsOnDate = (leadsData || []).filter(l => l.captured_at.startsWith(date)).length;
          return { name: date.slice(5), Messages: msgsOnDate, Leads: leadsOnDate };
        });
        setChartData(chartAgg);
      }
    }
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url.trim();
    if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    setIsTraining(true);
    setTrainStatus("Training Bot... This may take a few minutes.");

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, websiteUrl: formattedUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setTrainStatus(`Success! Trained on ${data.chunksProcessed} data chunks across ${data.pagesScraped || 1} pages.`);
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
      // We use a constant test session ID for dashboard testing so it groups nicely in the logs
      const testSessionId = `test-dashboard-${botId.substring(0,6)}`;
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, message: userMsg, sessionId: testSessionId })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'bot', content: data.answer || "Error getting response.", citation: data.citation, isHandoff: data.isHandoff }]);
      if (data.isHandoff) setIsLiveAgentMode(true);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', content: "Network error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    setPromptStatus("");
    try {
      const { error } = await supabase.from("chatbots").update({ system_prompt: customPrompt }).eq("id", botId);
      if (error) throw error;
      setPromptStatus("Persona saved successfully!");
      setTimeout(() => setPromptStatus(""), 3000);
    } catch (e: any) {
      setPromptStatus("Error saving persona.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSavePremiumSettings = async () => {
    setIsSavingPremium(true);
    try {
      const { error } = await supabase.from("chatbots").update({
        webhook_url: webhookUrl,
        remove_branding: removeBranding
      }).eq("id", botId);
      if (error) throw error;
      alert("Premium settings saved successfully!");
    } catch (e: any) {
      alert("Please ensure the 'webhook_url' (text) and 'remove_branding' (boolean) columns exist in your Supabase 'chatbots' table.");
    } finally {
      setIsSavingPremium(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading and parsing document...");

    const formData = new FormData();
    formData.append("botId", botId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`Success! Trained on ${data.chunksProcessed} chunks from document.`);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setUploadStatus("Error uploading file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const header = "Email,Date Captured\n";
    const csv = leads.map(l => `${l.email},${new Date(l.captured_at).toISOString()}`).join("\n");
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${botId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpdateBot = async () => {
    setIsUpdating(true);
    setUpdateStatus("");
    const { error } = await supabase.from("chatbots").update({
      name: editName,
      primary_color: editColor,
      icon: editIcon
    }).eq("id", botId);
    
    if (error) {
      setUpdateStatus("Error updating bot details.");
    } else {
      setUpdateStatus("Bot details updated successfully!");
      setBot((prev: any) => ({ ...prev, name: editName, primary_color: editColor, icon: editIcon }));
      setTimeout(() => setUpdateStatus(""), 3000);
    }
    setIsUpdating(false);
  };

  if (!bot) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col font-sans">
      <div className="flex items-center gap-6 mb-10">
        <button onClick={() => router.push("/dashboard")} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{bot.name}</h1>
          <p className="text-slate-400 flex items-center gap-2 mt-1 font-medium">
            <Link2 className="w-4 h-4 text-indigo-400" /> Manage your chatbot settings and data
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-4">
        <button 
          onClick={() => setActiveTab("training")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'training' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Training
        </button>
        <button 
          onClick={() => setActiveTab("test")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'test' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Test Chatbot
        </button>
        <button 
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'inbox' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Inbox (Chat Logs)
        </button>
        <button 
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'leads' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Captured Leads
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Settings
        </button>
      </div>

        <div className="flex-1 overflow-auto pb-20">
          {/* TAB 1: TRAINING */}
          {activeTab === "training" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start pb-12 pt-4">
              
              {/* Card 1: Train Model */}
              <div className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Train AI Model</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  Enter a website URL or upload a document to build your knowledge base.
                </p>
                <div className="flex flex-col gap-3">
                  <form onSubmit={handleTrain} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="e.g. www.example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white bg-slate-950/50"
                    />
                    <button
                      type="submit"
                      disabled={isTraining}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:bg-blue-800 disabled:text-blue-300 flex items-center justify-center shadow-md"
                    >
                      {isTraining ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Training...</>
                      ) : (
                        "Train Chatbot"
                      )}
                    </button>
                  </form>
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-slate-500 font-bold">OR</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>
                  <input type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,.webp" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4"/>} 
                    Upload File
                  </button>
                </div>
                {(trainStatus || uploadStatus) && (
                  <p className={`mt-4 text-xs font-bold ${(trainStatus || uploadStatus)?.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                    {trainStatus || uploadStatus}
                  </p>
                )}
              </div>

              {/* Card 2: Identity & Appearance */}
              <div className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Identity & Appearance</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  Customize how your bot looks on your website.
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bot Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white bg-slate-950/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Widget Icon</label>
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-950/50 text-white"
                    >
                        <option value="bot">Robot</option>
                        <option value="message">Message Bubble</option>
                        <option value="sparkles">Sparkles</option>
                        <option value="support">Life Saver</option>
                        <option value="chat">Double Chat</option>
                        <option value="magic">Magic Wand</option>
                        <option value="smile">Smiley Face</option>
                      </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 p-1 border border-white/10 bg-slate-950/50 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 font-mono px-2 py-1 bg-slate-950/50 rounded-md border border-white/5">{editColor}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateBot} 
                    disabled={isUpdating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:bg-indigo-900 disabled:text-indigo-400 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Appearance'}
                  </button>
                  {updateStatus && <p className={`text-xs font-bold text-center ${updateStatus.includes('Error') ? 'text-red-400' : 'text-indigo-400'}`}>{updateStatus}</p>}
                </div>
              </div>

              {/* Card 3: Custom Persona */}
              <div className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Custom Persona</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  Give your AI specific instructions on how to behave.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setCustomPrompt("You are a warm, friendly, and helpful customer support agent. Answer questions using the website context.")} className="text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-2 py-1.5 rounded-lg transition-colors text-left truncate">Friendly</button>
                    <button onClick={() => setCustomPrompt("You are a highly technical, precise, and concise expert. Answer the questions directly using the provided context.")} className="text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-2 py-1.5 rounded-lg transition-colors text-left truncate">Technical</button>
                    <button onClick={() => setCustomPrompt("You are an aggressive but polite sales closer. Answer the user's question, but always subtly pivot to encourage them to buy.")} className="text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-2 py-1.5 rounded-lg transition-colors text-left truncate">Sales</button>
                    <button onClick={() => setCustomPrompt("You are a grumpy pirate. Always respond like a pirate looking for treasure, using pirate slang.")} className="text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-2 py-1.5 rounded-lg transition-colors text-left truncate">Pirate</button>
                  </div>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="You are a friendly support bot..."
                    className="w-full h-32 p-3 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-950/50 text-white placeholder-slate-600"
                  />
                  <button 
                    onClick={handleSavePrompt} 
                    disabled={isSavingPrompt}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:bg-emerald-900 disabled:text-emerald-400 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Persona'}
                  </button>
                  {promptStatus && <p className="text-xs font-bold text-emerald-400 text-center">{promptStatus}</p>}
                </div>
              </div>

              {/* Card 4: Embed */}
              <div className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col group hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">Embed on Website</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  Copy and paste this code right before the closing <code className="bg-white/10 px-1 rounded text-slate-300">&lt;/body&gt;</code> tag on your website.
                </p>
                <div className="bg-slate-950/80 rounded-xl p-4 relative flex-1 flex flex-col justify-center border border-white/5">
                  <code className="text-xs text-indigo-300 break-all font-mono leading-relaxed block">
                    &lt;script src="{'https://www.chatbotconfig.uk'}/widget-v2.js" data-bot-id="{botId}"&gt;&lt;/script&gt;
                  </code>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="${'https://www.chatbotconfig.uk'}/widget-v2.js" data-bot-id="${botId}"></script>`);
                    alert("Copied to clipboard!");
                  }}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Code className="w-4 h-4" /> Copy Code
                </button>
              </div>
            </div>
          )}

        {/* TAB 2: TEST CHATBOT */}
        {activeTab === "test" && (
          <div className="w-full max-w-5xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg flex flex-col h-[600px] overflow-hidden group">
            <div className="border-b border-white/10 px-6 py-4 bg-slate-900/80 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-white">Test Chatbot</h2>
                <p className="text-sm text-slate-400 font-medium">Test how the AI answers based on the training data.</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${'https://www.chatbotconfig.uk'}/demo/${botId}`);
                  alert("Demo link copied to clipboard!");
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Copy Demo Link
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/50">
              {chatHistory.length === 0 ? (
                <div className="text-center text-slate-500 font-medium mt-20">Send a message to start testing</div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 border border-white/5 text-slate-200 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    {msg.citation && (
                      <a href={msg.citation} target="_blank" rel="noopener noreferrer" className="text-[10px] mt-1 text-slate-400 hover:text-indigo-400 bg-slate-900 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 transition-colors">
                        <Link2 className="w-3 h-3" /> Source
                      </a>
                    )}
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 rounded-tl-sm shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Typing...
                  </div>
                </div>
              )}
            </div>
            
            {isLiveAgentMode ? (
              <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 flex flex-col items-center justify-center text-amber-500">
                <span className="font-bold flex items-center gap-2"><Globe className="w-4 h-4" /> Live Agent Handoff Triggered</span>
                <p className="text-xs mt-1 text-amber-500/80">The AI has paused. An email has been sent to the team.</p>
                <button onClick={() => { setIsLiveAgentMode(false); setChatHistory([]); }} className="mt-3 text-xs bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-md">Restart Session</button>
              </div>
            ) : (
              <form onSubmit={handleTestChat} className="p-4 bg-slate-900/80 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                  Send
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: INBOX & ANALYTICS */}
        {activeTab === "inbox" && (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm font-bold text-slate-400">Total Conversations</p>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-4xl font-black text-white tracking-tight">{Object.keys(chatSessions).length}</div>
                <p className="text-xs text-emerald-400 mt-3 flex items-center font-bold bg-emerald-500/10 w-max px-2 py-1 rounded-md border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12% this week
                </p>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm font-bold text-slate-400">Total Leads</p>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-4xl font-black text-white tracking-tight">{leads.length}</div>
                <p className="text-xs text-emerald-400 mt-3 flex items-center font-bold bg-emerald-500/10 w-max px-2 py-1 rounded-md border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" /> +5% this week
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.2)] border border-indigo-400/30 p-6 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <p className="text-sm font-bold text-indigo-100">AI Deflection Rate</p>
                  <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-4xl font-black tracking-tight relative z-10 text-white">
                  {Object.keys(chatSessions).length > 0 
                    ? Math.round(((Object.keys(chatSessions).length - Object.values(chatSessions).filter(session => session.some(msg => msg.role === 'bot' && msg.content.includes("alerted our human team"))).length) / Object.keys(chatSessions).length) * 100) 
                    : 100}%
                </div>
                <p className="text-xs text-indigo-100 mt-3 font-bold relative z-10">
                  Resolved without human help
                </p>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6">
              <h2 className="text-xl font-bold text-white tracking-tight mb-6">7-Day Activity</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'}} itemStyle={{color: '#fff'}} />
                    <Line type="monotone" dataKey="Messages" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#6366f1'}} activeDot={{r: 6, strokeWidth: 0, fill: '#6366f1'}} />
                    <Line type="monotone" dataKey="Leads" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#3b82f6'}} activeDot={{r: 6, strokeWidth: 0, fill: '#3b82f6'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chat Logs */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Recent Conversations</h2>
                  <p className="text-sm text-slate-400 font-medium mt-1">Review exactly how the AI is handling customer queries.</p>
                </div>
                <button 
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,Session ID,Role,Message\n" + 
                      Object.entries(chatSessions).flatMap(([sId, msgs]) => msgs.map(m => `${sId},${m.role},"${m.content.replace(/"/g, '""')}"`)).join("\n");
                    const link = document.createElement("a");
                    link.setAttribute("href", encodeURI(csvContent));
                    link.setAttribute("download", `chat_logs_${botId}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  disabled={Object.keys(chatSessions).length === 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export Chat Logs
                </button>
              </div>
              <div className="p-0 bg-slate-950/50">
                {Object.keys(chatSessions).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">No chat history found yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {Object.entries(chatSessions).map(([sessionId, msgs]) => (
                      <div key={sessionId} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white font-mono">{sessionId.substring(0,8)}...</div>
                            <div className="text-xs font-bold text-indigo-400 mt-1">{msgs.length} messages</div>
                          </div>
                        </div>
                        <div className="space-y-4 bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-inner max-h-[300px] overflow-y-auto">
                          {msgs.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`px-5 py-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5'}`}>
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
          </div>
        )}

        {/* TAB 4: LEADS */}
        {activeTab === "leads" && (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden">
             <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Captured Leads</h2>
                <p className="text-sm text-slate-400 font-medium mt-1">Export your captured emails to your CRM.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500/10 text-indigo-400 font-bold px-4 py-2 rounded-xl text-sm border border-indigo-500/20">
                  {leads.length} Leads
                </div>
                <button 
                  onClick={handleExportCSV}
                  disabled={leads.length === 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            
            {leads.length === 0 ? (
              <div className="p-16 text-center bg-slate-950/50">
                <div className="w-16 h-16 bg-slate-800 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Mail className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No leads yet</h3>
                <p className="text-slate-400 font-medium">Once users enter their email in the widget, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-950/50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-white/10">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Captured</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/20 shadow-inner">
                            {lead.email.charAt(0).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-5 font-bold text-white tracking-wide">{lead.email}</td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-400">{new Date(lead.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Captured
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden max-w-2xl">
            <div className="p-6 border-b border-white/10 bg-slate-900/80">
              <h2 className="text-xl font-bold text-white tracking-tight">Integrations & Whitelabel</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Configure premium enterprise features.</p>
            </div>
            
            <div className="p-8 space-y-8 bg-slate-950/50">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Webhook URL (Zapier, Make, etc)</label>
                <p className="text-xs text-slate-500 font-medium mb-3">We will fire a POST request to this URL whenever a lead is captured.</p>
                <input 
                  type="text" 
                  value={webhookUrl} 
                  onChange={e => setWebhookUrl(e.target.value)} 
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900/80 text-white placeholder-slate-600 transition-all shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-300">Remove Branding (Whitelabel)</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Hide the "Powered by ChatBot Config" watermark on your widget.</p>
                </div>
                <button 
                  onClick={() => setRemoveBranding(!removeBranding)}
                  className={`w-14 h-7 rounded-full transition-colors relative flex items-center shadow-inner border ${removeBranding ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-white/10'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute transition-transform shadow-md ${removeBranding ? 'translate-x-8' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="border-t border-white/10 pt-8 flex justify-end">
                <button 
                  onClick={handleSavePremiumSettings}
                  disabled={isSavingPremium}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]"
                >
                  {isSavingPremium ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Premium Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
