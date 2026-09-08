"use client";

import Link from "next/link";
import { Bot, Settings, LayoutDashboard, HelpCircle, LogOut, LifeBuoy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen flex bg-[#0A0A0A] font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-md font-bold tracking-tight text-white">ChatBot Config</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname === "/dashboard" 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            My Bots
          </Link>
          <Link
            href="/dashboard/settings"
            className={`flex items-center px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname.includes("/dashboard/settings") 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
          <Link
            href="/dashboard/support"
            className={`flex items-center px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname.includes("/dashboard/support") 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <LifeBuoy className="w-5 h-5 mr-3" />
            Help & Support
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs font-mono text-slate-500 mb-2 px-2">USER</div>
          <div className="truncate px-2 text-sm text-slate-300 font-medium">{user ? user.email : 'Loading...'}</div>
          <button 
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#0A0A0A] relative">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
