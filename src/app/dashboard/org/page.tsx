"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useOrg } from "@/lib/org-context";
import { Users, Mail, Loader2, X, UserMinus } from "lucide-react";

type Member = { user_id: string; role: string; email: string | null; created_at: string };
type Invite = { id: string; email: string; role: string; expires_at: string };

export default function OrgPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrg();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isInviting, setIsInviting] = useState(false);

  const isManager = currentOrg?.role === "owner" || currentOrg?.role === "admin";

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;
    setIsFetching(true);
    const res = await fetch(`/api/org/${currentOrg.id}/members`);
    const data = await res.json();
    if (data.members) setMembers(data.members);
    if (data.invites) setInvites(data.invites);
    setIsFetching(false);
  }, [currentOrg]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const res = await fetch(`/api/org/${currentOrg.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setInviteEmail("");
        fetchMembers();
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string | null) => {
    if (!currentOrg) return;
    const res = await fetch(`/api/org/${currentOrg.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    await handleRoleChange(userId, null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!currentOrg) return;
    const res = await fetch(`/api/org/${currentOrg.id}/members?inviteId=${inviteId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchMembers();
  };

  if (isOrgLoading || (!currentOrg && !isFetching)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading team…
        </div>
      </div>
    );
  }

  if (!currentOrg) return null;

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Team</h1>
          <p className="mt-1 text-[15px] text-ink-muted">Who has access to {currentOrg.name}.</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
          <header className="flex items-center gap-2.5 border-b border-line bg-surface-muted px-6 py-4">
            <Users className="h-[18px] w-[18px] text-ink-muted" />
            <h2 className="text-[15px] font-semibold text-ink-strong">Members</h2>
          </header>

          {isFetching ? (
            <div className="p-6 text-sm text-ink-muted">Loading…</div>
          ) : (
            <div className="divide-y divide-line">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-strong">
                      {m.email || m.user_id}
                      {m.user_id === currentUserId && <span className="ml-2 text-[12px] text-ink-faint">(you)</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isManager && m.user_id !== currentUserId ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                        className="ds-input h-9 text-sm"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[12px] font-semibold capitalize text-ink-muted">
                        {m.role}
                      </span>
                    )}
                    {isManager && m.user_id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isManager && (
            <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-muted px-6 py-4">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="ds-input h-9 min-w-[200px] flex-1 text-sm"
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="ds-input h-9 text-sm">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Invite
              </button>
            </form>
          )}
        </section>

        {invites.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
            <header className="border-b border-line bg-surface-muted px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink-strong">Pending invites</h2>
            </header>
            <div className="divide-y divide-line">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-strong">{inv.email}</p>
                    <p className="text-[12px] text-ink-faint capitalize">
                      {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                      title="Revoke invite"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
