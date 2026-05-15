"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Check, X, Eye, Archive } from "lucide-react";

const ACTIONS = [
  { value: "reviewing", label: "Review",  icon: Eye   },
  { value: "accepted",  label: "Accept",  icon: Check },
  { value: "rejected",  label: "Reject",  icon: X     },
  { value: "withdrawn", label: "Archive", icon: Archive },
] as const;

type Status = "new" | "reviewing" | "accepted" | "rejected" | "withdrawn";

export function StatusButtons({ id, current }: { id: string; current: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyValue, setBusyValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function setStatus(next: Status) {
    setBusyValue(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/captains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      const j = (await res.json().catch(() => ({}))) as {
        issued_code?: string | null;
        email?: { ok: boolean; skipped?: boolean; error?: string } | null;
      };
      if (j.issued_code) {
        const emailMsg = j.email?.ok
          ? "email sent"
          : j.email?.skipped
            ? "email skipped (Resend not configured)"
            : j.email?.error
              ? `email failed: ${j.email.error}`
              : "email status unknown";
        setNotice(`Captain link /r/${j.issued_code} issued · ${emailMsg}`);
        setTimeout(() => setNotice(null), 8000);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyValue(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ value, label, icon: Icon }) => {
          const isCurrent = current === value;
          const isBusy = busyValue === value || (pending && busyValue === value);
          return (
            <button
              key={value}
              disabled={isCurrent || isBusy}
              onClick={() => setStatus(value)}
              className={[
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition",
                isCurrent
                  ? "bg-cream-100 text-ink-400 border-cream-200 cursor-default"
                  : "bg-white text-ink-700 border-cream-200 hover:bg-cream-100 hover:border-orange-300",
                isBusy ? "opacity-60 cursor-wait" : "",
              ].join(" ")}
            >
              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
              {label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {notice && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
          {notice}
        </p>
      )}
    </div>
  );
}
