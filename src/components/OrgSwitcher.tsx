"use client";

import { useState } from "react";
import { ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react";
import { useOrg } from "@/lib/org-context";
import { useRouter } from "next/navigation";

export default function OrgSwitcher() {
  const { orgs, currentOrg, setCurrentOrgId, isLoading, refetch } = useOrg();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const router = useRouter();

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const data = await res.json();
      if (data.org) {
        await refetch();
        setCurrentOrgId(data.org.id);
        setNewOrgName("");
        setOpen(false);
        router.refresh();
      } else {
        alert(data.error || "Failed to create organization.");
      }
    } catch {
      alert("Failed to create organization -- the server returned an unexpected response.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="h-[42px] animate-pulse rounded-lg bg-surface-muted" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink-strong">
            {currentOrg?.name || "No organization"}
          </span>
          {currentOrg && (
            <span className="block text-[11px] capitalize text-ink-faint">{currentOrg.role}</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-faint" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="ds-scrollbar absolute bottom-full left-0 z-50 mb-2 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-lg)]">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrgId(org.id);
                  setOpen(false);
                  router.refresh();
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-strong transition-colors hover:bg-surface-muted"
              >
                <span className="truncate">{org.name}</span>
                {org.id === currentOrg?.id && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            ))}

            <form onSubmit={handleCreateOrg} className="mt-1 flex items-center gap-1.5 border-t border-line p-1.5 pt-2.5">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New organization"
                className="ds-input h-9 flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={isCreating || !newOrgName.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                title="Create organization"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
