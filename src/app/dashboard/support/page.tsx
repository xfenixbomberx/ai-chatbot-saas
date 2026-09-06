"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const [category, setCategory] = useState("Technical Support");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, replyTo: email })
      });

      if (res.ok) {
        setStatus("success");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-2">Send us a message and our team will get back to you shortly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Form Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-gray-500 mb-6">We've received your request and will reply to {email} soon.</p>
              <button 
                onClick={() => setStatus("idle")}
                className="text-blue-600 font-medium hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Sales / Custom Plan">Sales / Custom Plan</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-red-500 text-sm font-medium">Failed to send message. Please try again.</p>
              )}

              <button 
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-bold flex items-center justify-center transition-colors"
              >
                {status === "submitting" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <Mail className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Response Time</h3>
            <p className="text-blue-800 text-sm">We aim to respond to all technical support tickets within 24 hours during business days.</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <MessageCircle className="w-6 h-6 text-green-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Enterprise Plans</h3>
            <p className="text-green-800 text-sm">Need higher limits or a custom integration? Select "Sales" to speak with our account team.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">How do I train my chatbot?</h3>
          <p className="text-gray-600 text-sm">
            You can train your chatbot in the dashboard by providing a website URL to scrape, or by uploading a PDF document.
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">How do I embed the widget on my site?</h3>
          <p className="text-gray-600 text-sm">
            Under the "Training & Integration" tab of your bot, copy the 1-line HTML snippet and paste it just before the closing <code>&lt;/body&gt;</code> tag of your website.
          </p>
        </div>
      </div>
    </div>
  );
}
