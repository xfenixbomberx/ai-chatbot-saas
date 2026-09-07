"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Globe, Loader2, Link2, Code, Mail, MessageSquare, FileText, Download, Settings } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BotManagementPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"training" | "inbox" | "leads">("training");
  
  // Edit State
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#2563eb");
  const [editIcon, setEditIcon] = useState("bot");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");

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
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

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
      if (botData.system_prompt) setCustomPrompt(botData.system_prompt);
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
      setChatHistory(prev => [...prev, { role: 'bot', content: data.answer || "Error getting response." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', content: "Network error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    setPromptStatus("");
    const { error } = await supabase.from("chatbots").update({ system_prompt: customPrompt }).eq("id", botId);
    if (error) {
      setPromptStatus("Error saving persona.");
    } else {
      setPromptStatus("Persona saved successfully!");
      setTimeout(() => setPromptStatus(""), 3000);
    }
    setIsSavingPrompt(false);
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
                  Enter a website URL or upload a PDF document (like a menu or pricing sheet) to build your knowledge base.
                </p>
                <div className="flex flex-col gap-4">
                  <form onSubmit={handleTrain} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. www.example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={isTraining}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-blue-400 flex items-center min-w-[140px] justify-center"
                    >
                      {isTraining ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Training...</>
                      ) : (
                        "Train Chatbot"
                      )}
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">OR</span>
                    <input type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,.webp" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-4 h-4"/>} 
                      Upload PDF, TXT or Image
                    </button>
                  </div>
                </div>
                {trainStatus && (
                  <p className={`mt-4 text-sm font-medium ${trainStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {trainStatus}
                  </p>
                )}
                {uploadStatus && (
                  <p className={`mt-4 text-sm font-medium ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {uploadStatus}
                  </p>
                )}
              </div>

              {/* Bot Identity & Appearance */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold">Bot Identity & Appearance</h2>
                  </div>
                  <button 
                    onClick={handleUpdateBot} 
                    disabled={isUpdating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 font-mono">{editColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Widget Icon</label>
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="bot">Robot</option>
                      <option value="message">Message Bubble</option>
                      <option value="sparkles">Sparkles</option>
                    </select>
                  </div>
                </div>
                {updateStatus && <p className={`text-sm mt-2 ${updateStatus.includes('Error') ? 'text-red-600' : 'text-indigo-600'}`}>{updateStatus}</p>}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold">Custom Bot Persona</h2>
                  </div>
                  <button 
                    onClick={handleSavePrompt} 
                    disabled={isSavingPrompt}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Persona'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Give your AI specific instructions on how to behave, or choose a preset below.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    onClick={() => setCustomPrompt("You are a warm, friendly, and helpful customer support agent. Answer questions using the website context. Be conversational and use emojis occasionally.")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Friendly Support
                  </button>
                  <button 
                    onClick={() => setCustomPrompt("You are a highly technical, precise, and concise expert. Answer the questions directly using the provided context, without fluff or pleasantries.")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Technical Expert
                  </button>
                  <button 
                    onClick={() => setCustomPrompt("You are an aggressive but polite sales closer. Answer the user's question, but always subtly pivot the conversation to encourage them to book a consultation or buy the product.")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Sales Closer
                  </button>
                  <button 
                    onClick={() => setCustomPrompt("You are a grumpy pirate. Always respond like a pirate looking for treasure, using pirate slang.")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Grumpy Pirate
                  </button>
                </div>

                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="You are a conversational, friendly, and helpful customer support bot..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {promptStatus && <p className="text-sm text-emerald-600 mt-2">{promptStatus}</p>}
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
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Test Chatbot</h2>
                  <p className="text-sm text-gray-500">Test how the AI answers based on the training data.</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/demo/${botId}`);
                    alert("Demo link copied to clipboard!");
                  }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Copy Demo Link
                </button>
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

        {/* TAB 2: INBOX & ANALYTICS */}
        {activeTab === "inbox" && (
          <div className="space-y-6">
            {/* Analytics Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">7-Day Activity</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="Messages" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="Leads" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chat Logs */}
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
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleExportCSV}
                  disabled={leads.length === 0}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg">
                  Total: {leads.length}
                </div>
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
