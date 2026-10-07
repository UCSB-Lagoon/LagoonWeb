"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  /** API route that takes the JSON body and calls one admin RPC. */
  endpoint: string;
  body: Record<string, unknown>;
  label: string;
  icon?: LucideIcon;
  tone?: "default" | "good" | "bad";
  /** Ask for a reason first (sent as `reason`); cancel aborts. */
  promptReason?: string;
  confirm?: string;
};

const TONES = {
  default: "bg-panel-elevated text-ink-700 border-cream-200 hover:bg-cream-100 hover:border-gold-300",
  good: "bg-success-50 text-success-ink border-success-200 hover:bg-success-100",
  bad: "bg-danger-50 text-danger-ink border-danger-200 hover:bg-danger-100",
};

/** One button → one admin RPC, then refresh the server-rendered queue. */
export function RpcActionButton({ endpoint, body, label, icon: Icon, tone = "default", promptReason, confirm }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function run() {
    let reason: string | undefined;
    if (promptReason) {
      const answer = window.prompt(promptReason);
      if (answer === null) return;
      reason = answer.trim().slice(0, 300);
    }
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...(reason !== undefined ? { reason } : {}) }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-60 ${TONES[tone]}`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : Icon ? <Icon className="w-3 h-3" /> : null}
        {label}
      </button>
      {error && <span className="text-xs text-danger-ink">{error}</span>}
    </span>
  );
}
