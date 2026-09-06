"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function DemoPage() {
  const params = useParams();
  const botId = params.id as string;
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [botConfig, setBotConfig] = useState<{name: string, primary_color: string} | null>(null);
  const [hasAskedForEmail, setHasAskedForEmail] = useState(false);
  const [hasProvidedEmail, setHasProvidedEmail] = useState(false);

  useEffect(() => {
    // Generate a unique session ID for this demo visitor so it shows up in Analytics
    setSessionId(`demo-${Math.random().toString(36).substring(2, 9)}`);
    
    // Fetch bot config for brand colors
    fetch(`/api/bot/${botId}`)
      .then(res => res.json())
      .then(data => {
        if (data.bot) {
          setBotConfig(data.bot);
          setMessages([{ role: "bot", content: `Hi there! I am the AI assistant for ${data.bot.name}. How can I help you today?` }]);
        }
      })
      .catch(console.error);

  }, [botId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    // Check if this is an email being provided
    if (hasAskedForEmail && !hasProvidedEmail && userMsg.includes("@")) {
      setHasProvidedEmail(true);
      setMessages(prev => [...prev, { role: "bot", content: "Thanks! A member of our team will be in touch." }]);
      setIsTyping(false);
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId, email: userMsg, session_id: sessionId })
        });
      } catch(e) {}
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, message: userMsg, sessionId })
      });
      
      const data = await res.json();
      const botReply = data.answer || "Error getting response.";
      
      // Ask for email immediately after first bot reply
      if (!hasAskedForEmail) {
        setHasAskedForEmail(true);
        setMessages(prev => [
          ...prev,
          { role: "bot", content: botReply },
          { role: "bot", content: "Just in case we get disconnected, what is your email address?" }
        ]);
      } else {
        setMessages(prev => [...prev, { role: "bot", content: botReply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", content: "Network error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const primaryColor = botConfig?.primary_color || "#2563eb";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* Chat Container */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[80vh] max-h-[800px]">
        
        {/* Header */}
        <div className="p-6 text-white text-center shadow-md z-10" style={{ backgroundColor: primaryColor }}>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">{botConfig ? botConfig.name : "Interactive AI Demo"}</h1>
          <p className="text-white/80 text-sm mt-1">Ask a question to see how this AI handles customer support.</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%] flex-row">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400 text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Viral Loop / Branding */}
      <a 
        href="https://chatbotconfig.uk" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-8 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2"
      >
        <Bot className="w-4 h-4" /> Powered by AI Chatbot SaaS
      </a>

    </div>
  );
}
