import Link from "next/link";
import { Bot, MessageSquare, Zap, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">AI Support Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
            Log in
          </Link>
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 md:py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 max-w-4xl mx-auto leading-tight">
          Turn your website into a <span className="text-blue-600">24/7 AI Support Agent</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Instantly train a custom AI on your website's data. Embed a beautiful, branded chat widget in seconds and automate your customer support forever.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/login" 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform transform hover:scale-105 flex items-center justify-center"
          >
            Start Building Now <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">Starting at £49/month. Cancel anytime.</p>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24 border-t border-gray-200">
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
