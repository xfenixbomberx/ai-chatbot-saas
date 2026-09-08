"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export type Org = {
  id: string;
  name: string;
  plan_tier: "free" | "starter" | "pro" | "enterprise";
  plan_status: "inactive" | "active" | "past_due" | "canceled";
  stripe_customer_id: string | null;
  role: OrgRole;
};

type OrgContextValue = {
  orgs: Org[];
  currentOrg: Org | null;
  setCurrentOrgId: (id: string) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

const STORAGE_KEY = "cbc_current_org_id";

// Loaded once at the dashboard layout level and shared by every dashboard
// page -- replaces the old per-page `chatbots.user_id` scoping now that
// bots belong to an organization, not a single user.
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setOrgs([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, plan_tier, plan_status, stripe_customer_id)")
      .eq("user_id", session.user.id);

    type MembershipRow = { role: OrgRole; organizations: Omit<Org, "role"> | null };
    const loaded: Org[] = ((data as unknown as MembershipRow[]) || [])
      .filter((row) => row.organizations)
      .map((row) => ({ ...(row.organizations as Omit<Org, "role">), role: row.role }));

    setOrgs(loaded);

    setCurrentOrgIdState((prev) => {
      const stored = prev || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
      const stillValid = loaded.some((o) => o.id === stored);
      return stillValid ? stored : loaded[0]?.id || null;
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage unavailable -- selection just won't persist across reloads.
    }
  };

  const currentOrg = orgs.find((o) => o.id === currentOrgId) || null;

  return (
    <OrgContext.Provider value={{ orgs, currentOrg, setCurrentOrgId, isLoading, refetch: fetchOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within an OrgProvider");
  return ctx;
}
