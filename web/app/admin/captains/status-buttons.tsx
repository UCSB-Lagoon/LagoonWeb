"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Check, X, Eye, Archive, Mail, MailCheck } from "lucide-react";

const ACTIONS = [
  { value: "reviewing", label: "Review",  icon: Eye   },
  { value: "accepted",  label: "Accept",  icon: Check },
  { value: "rejected",  label: "Reject",  icon: X     },
  { value: "withdrawn", label: "Archive", icon: Archive },
] as const;

type Status = "new" | "reviewing" | "accepted" | "rejected" | "withdrawn";

type Props = {
  id: string;
  current: Status;
  captainCode?: string | null;
  emailedAt?: string | null;
};

export function StatusButtons({ id, current, captainCode, emailedAt }: Props) {
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
        mailto_url?: string | null;
      };
      if (j.mailto_url) {
        // Default zero-setup path: open the admin's mail client with everything pre-filled.
        window.location.href = j.mailto_url;
      }
      if (j.issued_code) {
        const emailMsg = j.email?.ok
          ? "email sent automatically"
          : j.mailto_url
            ? "opening your mail app — hit send, then click ✉ Mark sent"
            : j.email?.error
              ? `email failed: ${j.email.error}`
              : "email status unknown";
        setNotice(`Captain link /r/${j.issued_code} issued · ${emailMsg}`);
        setTimeout(() => setNotice(null), 12000);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyValue(null);
    }
  }

  async function markEmailed() {
    setBusyValue("mark-emailed");
    setError(null);
    try {
      const res = await fetch(`/api/admin/captains/${id}?action=mark-emailed`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      setNotice("Marked as emailed ✉");
      setTimeout(() => setNotice(null), 4000);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyValue(null);
    }
  }

  const showMailHelpers = current === "accepted" && captainCode;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {showMailHelpers && !emailedAt && (
          <button
            onClick={markEmailed}
            disabled={busyValue === "mark-emailed"}
            title="Record that you've sent the welcome email"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-60"
          >
            {busyValue === "mark-emailed" ? <Loader2 className="w-3 h-3 animate-spin" /> : <MailCheck className="w-3 h-3" />}
            Mark sent
          </button>
        )}
        {showMailHelpers && !emailedAt && (
          <button
            onClick={async () => {
              const res = await fetch(`/api/admin/captains/${id}/draft-email`).then(r => r.json()).catch(() => null) as { mailto_url?: string } | null;
              if (res?.mailto_url) window.location.href = res.mailto_url;
            }}
            title="Open the welcome email in your default mail client"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-white text-ink-700 border-cream-200 hover:bg-cream-100 transition"
          >
            <Mail className="w-3 h-3" /> Open email
          </button>
        )}
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
