"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, CreditCard, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_subscribed")
          .eq("id", session.user.id)
          .single();
          
        if (profile) {
          setIsSubscribed(profile.is_subscribed);
        }
      }
      setIsLoading(false);
    };
    
    fetchUserAndProfile();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and subscription preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="text" 
                disabled 
                value={user?.email || ""}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-2">Your email address is managed by your authentication provider.</p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Subscription & Billing</h2>
          </div>
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-gray-900 font-medium">Current Plan:</h3>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Pro (£99/mo)
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                    Free / Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {isSubscribed 
                  ? "You have full access to all AI chatbot features." 
                  : "Upgrade to Pro to unlock AI chatbot creation."}
              </p>
            </div>
            
            <button 
              disabled
              className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
              title="Customer portal coming soon!"
            >
              Manage Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
