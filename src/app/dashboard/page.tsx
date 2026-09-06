"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Bot, Globe, X, Trash2, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [botColor, setBotColor] = useState("#2563eb");
  const [botIcon, setBotIcon] = useState("bot");
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // 1. Check if returning from a successful Stripe checkout
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        await fetch('/api/success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id })
        });
        // Clear the URL params cleanly
        router.replace('/dashboard');
        setIsSubscribed(true);
        fetchBots(session.user.id);
        return;
      }

      // 2. Fetch the user's subscription profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", session.user.id)
        .single();
        
      const hasPaid = profile?.is_subscribed || false;
      setIsSubscribed(hasPaid);

      // 3. Only fetch bots if they paid
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
        window.location.href = data.url; // Redirect to Stripe
      } else {
        alert("Error: " + data.error);
        setIsCheckoutLoading(false);
      }
    } catch (e) {
      alert("Failed to connect to checkout.");
      setIsCheckoutLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("chatbots")
      .insert([{ 
        name: botName, website_url: websiteUrl, user_id: user.id,
        primary_color: botColor, icon: botIcon
      }]);

    setIsLoading(false);

    if (error) {
      alert("Error creating chatbot: " + error.message);
    } else {
      setIsModalOpen(false);
      setBotName("");
      setWebsiteUrl("");
      setBotColor("#2563eb");
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

  // While checking subscription status
  if (isSubscribed === null) {
    return <div className="p-8 text-gray-500">Loading your dashboard...</div>;
  }

  // PAYWALL UI
  if (!isSubscribed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Select your plan</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Get full access to the AI Support Assistant platform. Upgrade your customer support with 24/7 automated agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
          
          {/* Starter Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">£49<span className="text-lg text-gray-500 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> 1 AI Chatbot</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Basic Website Scraping</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Standard Analytics</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || "price_1UCk2WLuviuLNWsXWEayNFDA")}
              disabled={isCheckoutLoading}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl font-bold transition-colors"
            >
              Get Starter
            </button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="bg-blue-600 p-8 rounded-2xl shadow-xl border border-blue-700 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-extrabold text-white mb-6">£99<span className="text-lg text-blue-200 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1 text-white">
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> 3 AI Chatbots</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> Unlimited AI Training</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> Custom Branding & Colors</li>
              <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-cyan-300 mr-3 shrink-0" /> PDF Document Upload</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_1UCk3aLuviuLNWsXFQApelRq")}
              disabled={isCheckoutLoading}
              className="w-full bg-white hover:bg-gray-50 text-blue-600 py-3 rounded-xl font-bold transition-colors shadow-sm"
            >
              Get Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">£299<span className="text-lg text-gray-500 font-medium">/mo</span></div>
            <ul className="text-left space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> 10 AI Chatbots</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Remove "Powered By" Watermark</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Dedicated Account Manager</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Priority Support</li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || "price_1UCk4hLuviuLNWsX44ndHMEj")}
              disabled={isCheckoutLoading}
              className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-colors"
            >
              Get Enterprise
            </button>
          </div>

        </div>
        
        {isCheckoutLoading && (
          <p className="mt-8 text-blue-600 font-medium animate-pulse">Securely routing to Stripe...</p>
        )}
      </div>
    );
  }

  // NORMAL DASHBOARD UI
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Chatbots</h1>
          <p className="text-gray-500 mt-1">Manage and train your AI assistants.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Chatbot
        </button>
      </div>

      {isFetching ? (
        <div className="text-gray-500">Loading your bots...</div>
      ) : bots.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots yet</h3>
          <p className="text-gray-500 mb-4">Create your first AI assistant to get started.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 font-medium hover:underline"
          >
            Create one now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Link href={`/dashboard/bot/${bot.id}`} key={bot.id} className="block">
              <div className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
                <button
                  onClick={(e) => handleDeleteBot(e, bot.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Chatbot"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex items-center mb-4 pr-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: bot.primary_color || '#2563eb' }}>
                    {bot.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 ml-3 truncate">{bot.name}</h3>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Globe className="w-4 h-4 mr-1 shrink-0" />
                  <span className="truncate">{bot.website_url}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Chatbot</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                  <input
                    type="text"
                    required
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. Acme Support AI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL to Scrape</label>
                  <input
                    type="url"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      required
                      value={botColor}
                      onChange={(e) => setBotColor(e.target.value)}
                      className="w-10 h-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{botColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Widget Icon</label>
                  <select
                    value={botIcon}
                    onChange={(e) => setBotIcon(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="bot">Robot</option>
                    <option value="message">Message Bubble</option>
                    <option value="sparkles">Sparkles</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium transition-colors"
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
