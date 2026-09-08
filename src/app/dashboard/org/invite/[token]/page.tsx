"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useOrg } from "@/lib/org-context";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { refetch, setCurrentOrgId } = useOrg();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const accept = async () => {
      const res = await fetch(`/api/org/invites/${token}/accept`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setStatus("error");
        setError(data.error);
      } else {
        await refetch();
        setCurrentOrgId(data.orgId);
        setStatus("success");
        setTimeout(() => router.replace("/dashboard"), 1500);
      }
    };
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-[var(--shadow-xs)]">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
            <p className="mt-4 text-[15px] text-ink-muted">Accepting invite…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-positive" />
            <p className="mt-4 text-[15px] text-ink-strong">You&apos;ve joined the team. Redirecting…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-4 text-[15px] text-ink-strong">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
