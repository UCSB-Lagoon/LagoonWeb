"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pin, PinOff } from "lucide-react";

const FLOW = ["new", "triaged", "planned", "shipped", "declined"] as const;
type Status = (typeof FLOW)[number];

export function FeedbackActions({
  id, status, pinned,
}: { id: string; status: Status; pinned: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-1.5 justify-end">
        <button
          onClick={() => patch({ pinned: !pinned }, "pin")}
          title={pinned ? "Unpin" : "Pin to top"}
          className={[
            "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition",
            pinned
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-white text-ink-500 border-cream-200 hover:bg-cream-100",
          ].join(" ")}
        >
          {busy === "pin" ? <Loader2 className="w-3 h-3 animate-spin" /> : pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </button>
        {FLOW.map((s) => (
          <button
            key={s}
            disabled={status === s || busy === s}
            onClick={() => patch({ status: s }, s)}
            className={[
              "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition capitalize",
              status === s
                ? "bg-cream-100 text-ink-400 border-cream-200 cursor-default"
                : "bg-white text-ink-700 border-cream-200 hover:bg-cream-100 hover:border-orange-300",
              busy === s ? "opacity-60" : "",
            ].join(" ")}
          >
            {busy === s ? <Loader2 className="w-3 h-3 animate-spin inline" /> : s}
          </button>
        ))}
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}
