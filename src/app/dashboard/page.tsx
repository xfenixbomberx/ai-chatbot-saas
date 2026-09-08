"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Bot, Globe, X, Trash2, CheckCircle2, Shield, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [botColor, setBotColor] = useState("#4f46e5");
  const [botIcon, setBotIcon] = useState("bot");
  const [isLoading, setIsLoading] = useState(false);
  const [isTrainingAll, setIsTrainingAll] = useState(false);
  
  const [bots, setBots] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Paywall State
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setUser(session.user);
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        await fetch('/api/success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id })
        });
        router.replace('/dashboard');
        setIsSubscribed(true);
        fetchBots(session.user.id);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", session.user.id)
        .single();
        
      const hasPaid = profile?.is_subscribed || false;
      setIsSubscribed(hasPaid);

      if (hasPaid) {
        fetchBots(session.user.id);
      } else {
        setIsFetching(false);
      }
    };
    init();
  }, [router]);

  const fetchBots = async (userId: string) => {
    setIsFetching(true);
    const { data } = await supabase
      .from("chatbots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (data) setBots(data);
    setIsFetching(false);
  };

  const handleCheckout = async (priceId: string) => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, priceId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + data.error);
        setIsCheckoutLoading(false);
      }
    } catch (e) {
      alert("Failed to connect to checkout.");
      setIsCheckoutLoading(false);
    }
  };

  const handleTrainAll = async () => {
    if (!bots || bots.length === 0) return;
    setIsTrainingAll(true);
    let successCount = 0;
    
    for (const bot of bots) {
      if (bot.website_url) {
        try {
          const res = await fetch("/api/train", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId: bot.id, websiteUrl: bot.website_url }),
          });
          if (res.ok) successCount++;
        } catch (error) {
          console.error(`Failed to train bot ${bot.name}`, error);
        }
      }
    }
    
    setIsTrainingAll(false);
    alert(`Successfully trained ${successCount} chatbots!`);
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    let formattedUrl = websiteUrl.trim();
    if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const { data, error } = await supabase
      .from("chatbots")
      .insert([{ 
        name: botName, website_url: formattedUrl, user_id: user.id,
        primary_color: botColor, icon: botIcon
      }]);

    setIsLoading(false);

    if (error) {
      alert("Error creating chatbot: " + error.message);
    } else {
      if (formattedUrl) {
        const newBot = await supabase
          .from("chatbots")
          .select("id")
          .eq("user_id", user.id)
          .eq("website_url", formattedUrl)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (newBot.data?.id) {
          fetch("/api/train", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId: newBot.data.id, websiteUrl: formattedUrl }),
          }).catch(console.error);
        }
      }

      setIsModalOpen(false);
      setBotName("");
      setWebsiteUrl("");
      setBotColor("#4f46e5");
      setBotIcon("bot");
      fetchBots(user.id);
    }
  };

  const handleDeleteBot = async (e: React.MouseEvent, botId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chatbot? This action cannot be undone.")) return;

    const { error } = await supabase.from("chatbots").delete().eq("id", botId);
    if (error) alert("Error deleting chatbot: " + error.message);
    else fetchBots(user.id);
  };

  if (isSubscribed === null) {
    return <div className="p-8 text-slate-400">Loading your dashboard...</div>;
  }

  // PAYWALL UI
  if (!isSubscribed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 lg:p-8 relative">
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" /> Secure Stripe Checkout
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Select your plan</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Get full access to the ChatBot Config platform. Upgrade your customer support with 24/7 automated agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full relative z-10 items-center">
          {/* Starter Plan */}
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/30 group">
            <h3 className="text-2xl font-bold text-slate-300 mb-2">Starter</h3>
            <div className="text-4xl font-extrabold text-white mb-6">£49<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1">
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0" /> 1 AI Chatbot</li>
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0" /> Basic Website Scraping</li>
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0" /> Standard Analytics</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || "price_1UCk2WLuviuLNWsXWEayNFDA")}
              disabled={isCheckoutLoading}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3.5 rounded-xl font-bold transition-all group-hover:scale-[1.02]"
            >
              Get Starter
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-indigo-600 to-blue-700 p-8 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-indigo-400/30 flex flex-col relative transform md:-translate-y-4 transition-all duration-500 hover:-translate-y-6 group">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-blue-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold text-indigo-100 mb-2">Pro</h3>
            <div className="text-4xl font-extrabold text-white mb-6">£99<span className="text-lg text-indigo-300 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1 text-white">
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> 3 AI Chatbots</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> Unlimited AI Training</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> Custom Branding & Colors</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> PDF Document Upload</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_1UCk3aLuviuLNWsXFQApelRq")}
              disabled={isCheckoutLoading}
              className="w-full bg-white hover:bg-slate-100 text-indigo-700 py-3.5 rounded-xl font-bold transition-all shadow-sm group-hover:scale-[1.02]"
            >
              Get Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:border-slate-500/30 group">
            <h3 className="text-2xl font-bold text-slate-300 mb-2">Enterprise</h3>
            <div className="text-4xl font-extrabold text-white mb-6">£299<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1">
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0" /> 10 AI Chatbots</li>
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0" /> Remove "Powered By" Watermark</li>
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0" /> Dedicated Account Manager</li>
              <li className="flex items-center text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0" /> Priority Support</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || "price_1UCk4hLuviuLNWsX44ndHMEj")}
              disabled={isCheckoutLoading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-all group-hover:scale-[1.02]"
            >
              Get Enterprise
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL DASHBOARD UI
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Chatbots</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage and train your AI assistants.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleTrainAll}
            disabled={isTrainingAll || bots.length === 0}
            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isTrainingAll ? "animate-spin" : ""}`} />
            {isTrainingAll ? "Training All..." : "Train All"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Chatbot
          </button>
        </div>
      </div>

      {isFetching ? (
        <div className="text-slate-500">Loading your bots...</div>
      ) : bots.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-16 text-center shadow-2xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No chatbots yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first AI assistant to get started automating your customer support.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            Create one now &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Link href={`/dashboard/bot/${bot.id}`} key={bot.id} className="block">
              <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all cursor-pointer">
                <button
                  onClick={(e) => handleDeleteBot(e, bot.id)}
                  className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Chatbot"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex items-center mb-6 pr-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg" style={{ backgroundColor: bot.primary_color || '#4f46e5' }}>
                    {bot.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-white ml-4 truncate">{bot.name}</h3>
                </div>
                <div className="text-sm text-slate-400 flex items-center bg-slate-950/50 rounded-lg p-2 border border-white/5">
                  <Globe className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                  <span className="truncate font-mono">{bot.website_url}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">New Chatbot</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Bot Name</label>
                  <input
                    type="text"
                    required
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. Acme Support AI"
                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white bg-slate-950/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Website URL to Scrape</label>
                  <input
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. www.chatbotconfig.uk"
                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white bg-slate-950/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      required
                      value={botColor}
                      onChange={(e) => setBotColor(e.target.value)}
                      className="w-12 h-12 p-1 border border-white/10 bg-slate-950/50 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm font-mono text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/10">{botColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Widget Icon</label>
                  <select
                    value={botIcon}
                    onChange={(e) => setBotIcon(e.target.value)}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white bg-slate-950/50"
                  >
                    <option value="bot">Robot</option>
                    <option value="message">Message Bubble</option>
                    <option value="sparkles">Sparkles</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-300 text-white py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                >
                  {isLoading ? "Creating..." : "Create Chatbot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
