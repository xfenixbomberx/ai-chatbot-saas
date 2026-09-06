import Link from "next/link";
import { Bot, MessageSquare, Zap, Shield, ArrowRight, ChevronDown, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative overflow-hidden">
      
      {/* Background Tech Grid & Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">AI Support Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
            Log in
          </Link>
          <Link 
            href="/login" 
            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-20 md:pt-24 text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          ✨ New: Train AI on your PDF documents
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 max-w-4xl mx-auto leading-tight">
          Turn your website into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">24/7 AI Support Agent</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Instantly train a custom AI on your website's data. Embed a beautiful, branded chat widget in seconds and automate your customer support forever.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/login" 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform transform hover:scale-105 flex items-center justify-center shadow-xl shadow-blue-600/20"
          >
            Start Building Now <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">Starting at £49/month. Cancel anytime.</p>
        
        {/* Social Proof */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex gap-1 text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
          </div>
          <p className="text-sm text-gray-500 font-medium">Trusted by 100+ forward-thinking businesses</p>
        </div>

        {/* Floating Mockup */}
        <div className="mt-16 w-full max-w-4xl mx-auto relative hidden md:block group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent rounded-t-3xl blur-2xl transition-all duration-700 group-hover:bg-blue-500/30"></div>
          <div className="relative bg-white border border-gray-200 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-700 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                   <Bot className="text-white w-5 h-5"/>
                 </div>
                 <div className="flex flex-col items-start">
                   <span className="font-bold text-white leading-tight">AI Support Agent</span>
                   <span className="text-blue-100 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</span>
                 </div>
               </div>
               <div className="flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-white/20"></div>
                 <div className="w-3 h-3 rounded-full bg-white/20"></div>
                 <div className="w-3 h-3 rounded-full bg-white/20"></div>
               </div>
            </div>
            <div className="p-8 bg-gray-50 flex flex-col gap-6 h-72 overflow-hidden relative">
               <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm text-sm text-gray-700 text-left">
                 Hi there! 👋 How can I help you scale your support today?
               </div>
               <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[75%] shadow-sm text-sm self-end text-left">
                 Can you handle our customer emails too?
               </div>
               <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm text-sm text-gray-700 text-left">
                 Absolutely. I can capture leads and instantly hand off complex queries to your human team directly via email.
               </div>
               {/* Gradient fade at bottom to blend into the section below */}
               <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
        
        {/* Scroll Arrow */}
        <div className="mt-8 flex justify-center animate-bounce relative z-20">
          <a href="#features" className="text-gray-400 hover:text-blue-600 transition-colors p-2" aria-label="Scroll down">
            <ChevronDown className="w-8 h-8" />
          </a>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-t border-gray-200 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to scale your support</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Stop answering the same questions manually. Let our intelligent AI agents handle your customers instantly.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Training</h3>
              <p className="text-gray-600">Just paste your website URL. Our system scrapes your content and trains a custom AI model in seconds.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Custom Branding</h3>
              <p className="text-gray-600">Match the widget to your company. Pick your brand colors, custom bot name, and custom icons to fit your style.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">Powered by the latest Google Gemini AI models and Supabase vector databases for ultra-fast, accurate responses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-white tracking-tight">AI Support Assistant</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} AI Support Assistant. All rights reserved.</p>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="mailto:support@chatbotconfig.uk" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
