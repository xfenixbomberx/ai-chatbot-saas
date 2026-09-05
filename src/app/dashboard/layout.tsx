"use client";

import Link from "next/link";
import { Bot, Settings, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Bot className="w-6 h-6 text-blue-600 mr-2 shrink-0" />
          <span className="text-md font-bold tracking-tight">AI Support Assistant</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium"
          >
            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-500" />
            My Bots
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors font-medium"
          >
            <Settings className="w-5 h-5 mr-3 text-gray-400" />
            Settings
          </Link>
        </nav>
        <div className="p-4 pb-12 border-t border-gray-200">
          <button 
            onClick={async () => {
              const { supabase } = await import('@/lib/supabase');
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
