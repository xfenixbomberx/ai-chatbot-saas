"use client";

import Link from "next/link";
import { Bot, MessageSquare, Zap, Shield, ArrowRight, ChevronDown, Star, CheckCircle2, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-slate-300 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background Tech Grid & Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ChatBot Config</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium bg-white hover:bg-slate-200 text-black px-5 py-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        
        {/* Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-10 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          Enterprise features now available
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 max-w-5xl mx-auto leading-[1.1]"
        >
          Automate your support. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">
            Scale your business.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
        >
          Instantly train a custom AI on your website's data. Embed a beautiful, intelligent chat widget in seconds and resolve customer queries 24/7.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            href="/login" 
            className="w-full sm:w-auto bg-white hover:bg-slate-200 text-black px-8 py-4 rounded-full font-bold text-lg transition-transform transform hover:scale-105 flex items-center justify-center"
          >
            Start Building Now <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <a 
            href="#features" 
            className="w-full sm:w-auto bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md px-8 py-4 rounded-full font-bold text-lg transition-colors flex items-center justify-center"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Floating Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-24 w-full max-w-5xl mx-auto relative hidden md:block"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 top-1/2"></div>
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
            {/* Mockup Header */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 bg-slate-900/80 gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="mx-auto bg-slate-800 rounded-md px-4 py-1 text-xs text-slate-400 font-mono flex items-center gap-2">
                <Globe className="w-3 h-3" /> chatbotconfig.uk
              </div>
            </div>
            {/* Mockup Body */}
            <div className="flex">
              <div className="w-64 border-r border-white/10 p-4 space-y-4 bg-slate-900/30">
                <div className="h-8 bg-slate-800 rounded-lg w-full animate-pulse"></div>
                <div className="h-8 bg-slate-800/50 rounded-lg w-3/4"></div>
                <div className="h-8 bg-slate-800/50 rounded-lg w-5/6"></div>
              </div>
              <div className="flex-1 p-8 h-96 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="max-w-md float-right bg-indigo-600 rounded-2xl rounded-tr-sm p-4 text-white text-sm shadow-lg mb-4">
                  How does the new Zapier integration work?
                </div>
                <div className="clear-both"></div>
                <div className="max-w-md float-left bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm p-4 text-slate-200 text-sm shadow-lg">
                  It's simple! Just paste your webhook URL in the Settings tab, and we'll instantly fire a POST request with the customer's email whenever a lead is captured. <br/><br/>
                  <span className="text-indigo-400 font-medium cursor-pointer">🔗 View Documentation</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Grid (Bento) */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Everything you need to succeed.</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Enterprise-grade infrastructure packed into a beautifully simple dashboard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
              <Zap className="w-10 h-10 text-indigo-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Instant Training</h3>
              <p className="text-slate-400 text-lg max-w-md">Just enter your website URL. Our system recursively scrapes your pages and trains an intelligent vector database in seconds.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gradient-to-bl from-slate-900 to-slate-950 border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <Shield className="w-10 h-10 text-blue-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Zero Hallucinations</h3>
              <p className="text-slate-400 text-lg">Bots strictly answer using your data and provide clickable source citations.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <MessageSquare className="w-10 h-10 text-cyan-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Live Agent Handoff</h3>
              <p className="text-slate-400 text-lg">If the bot gets stuck, it pauses and instantly emails your human team to take over.</p>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-2 bg-gradient-to-tl from-slate-900 to-slate-950 border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
              <Bot className="w-10 h-10 text-purple-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Custom Integrations</h3>
              <p className="text-slate-400 text-lg max-w-md">Connect directly to Zapier, Make, and HubSpot using our Enterprise webhooks. Completely remove our branding for a native feel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-indigo-500" />
            <span className="text-lg font-bold text-white tracking-tight">ChatBot Config</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} ChatBot Config. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
