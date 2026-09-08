"use client";

import Link from "next/link";
import {
  Bot,
  Settings,
  LayoutDashboard,
  LogOut,
  LifeBuoy,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/dashboard", label: "My bots", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Help & support", icon: LifeBuoy },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-[0_2px_8px_rgba(79,70,229,0.28)]">
            <Bot className="h-[18px] w-[18px] text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-strong">
            ChatBot Config
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive(item)
                ? "flex items-center gap-3 rounded-lg bg-accent-soft px-3 py-2.5 text-sm font-semibold text-accent-ink"
                : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-strong"
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        ))}

        <div className="pt-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-strong"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            View website
          </Link>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="rounded-lg bg-surface-muted p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm font-medium text-ink-strong">
            {user ? user.email : "…"}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-muted font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-strong/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-[var(--shadow-xl)]">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-[15px] font-semibold text-ink-strong">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-4 w-4 text-white" />
            </span>
            ChatBot Config
          </span>
        </div>

        <main className="ds-scrollbar flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
