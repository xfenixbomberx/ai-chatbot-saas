"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, BrainCircuit, Globe, Loader2, Send, MessageSquare } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function ManageBotPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.id;
  
  const [bot, setBot] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);

  // Chat UI State
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    const fetchBot = async () => {
      const { data } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", botId)
        .single();
      if (data) setBot(data);
    };
    fetchBot();
  }, [botId]);

  const handleTrainAI = async () => {
    setIsTraining(true);
    setTrainingStatus("Scraping website & training AI...");
    
    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, websiteUrl: bot.website_url }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Training failed: " + data.error);
      } else {
        alert(`Success! Your AI is now fully trained on ${data.chunksProcessed} segments of your website.`);
      }
    } catch (error) {
      alert("Something went wrong during training.");
    } finally {
      setIsTraining(false);
      setTrainingStatus(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMsg.trim()) return;
    
    const newMsgs = [...messages, { role: "user", text: currentMsg }];
    setMessages(newMsgs);
    setCurrentMsg("");
    setIsChatting(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, message: currentMsg })
      });
      const data = await res.json();
      
      setMessages([...newMsgs, { role: "bot", text: data.answer || data.error }]);
    } catch(e) {
      setMessages([...newMsgs, { role: "bot", text: "Error connecting to AI." }]);
    }
    setIsChatting(false);
  };

  if (!bot) return <div className="p-8 text-gray-500">Loading bot details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center text-sm font-medium mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{bot.name}</h1>
        <div className="flex items-center text-gray-500 mt-2">
          <Globe className="w-4 h-4 mr-2" />
          <a href={bot.website_url} target="_blank" rel="noreferrer" className="hover:underline">
            {bot.website_url}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Left Side: Training */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col h-full">
          <div className="flex items-start mb-6">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Knowledge Base</h2>
              <p className="text-gray-500 mt-1">
                Train your chatbot by scraping the text directly from the website URL. The AI will chunk the text and store it in your database.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleTrainAI}
            disabled={isTraining}
            className="w-full mt-auto bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center"
          >
            {isTraining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {trainingStatus}
              </>
            ) : (
              "Scrape & Train AI"
            )}
          </button>
        </div>

        {/* Right Side: Chat Tester */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[500px] md:h-full overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="font-bold text-gray-900">Test Your Chatbot</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <p>Send a message to test your trained AI.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 rounded-xl rounded-bl-none p-3 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> AI is thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              value={currentMsg}
              onChange={(e) => setCurrentMsg(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={isChatting || !currentMsg.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Embed on Your Website</h2>
        <p className="text-gray-500 mb-4">
          Copy and paste this script tag just before the closing <code>&lt;/body&gt;</code> tag of your website HTML.
        </p>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          {`<script src="http://localhost:3000/widget.js" data-bot-id="${bot.id}"></script>`}
        </div>
      </div>
    </div>
  );
}
