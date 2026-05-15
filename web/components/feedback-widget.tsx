"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, X, Loader2, CheckCircle2, Bug, Lightbulb, Heart, HelpCircle } from "lucide-react";

const KINDS = [
  { value: "idea",     label: "Idea",     icon: Lightbulb },
  { value: "bug",      label: "Bug",      icon: Bug },
  { value: "praise",   label: "Praise",   icon: Heart },
  { value: "question", label: "Question", icon: HelpCircle },
] as const;

/**
 * Floating "Feedback" button + slide-up panel. Present on every Next.js
 * route via the root layout. Mirrors the Linear / Raycast / Vercel pattern:
 * always one tap away, low friction, kind + message + optional email.
 */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>("idea");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (fd.get("company")) { setStatus("done"); return; } // honeypot
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message: fd.get("message"),
          email: fd.get("email") || undefined,
          page_path: typeof window !== "undefined" ? location.pathname : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Failed to send");
      }
      setStatus("done");
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "feedback_submit", { kind });
      }
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-ink-900 text-cream-50 pl-4 pr-5 py-3 text-sm font-semibold shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:bg-ink-700 transition print:hidden"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full sm:max-w-md card p-5 sm:p-6 animate-[fadeIn_.2s_ease]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">Send feedback</h2>
                <p className="text-sm text-ink-500">We read every single one. Promise.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-400 hover:text-ink-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === "done" ? (
              <div className="text-center py-8">
                <div className="grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="mt-4 font-display font-bold text-lg text-ink-900">Got it — thank you.</p>
                <p className="text-sm text-ink-500">This goes straight to the team.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <div className="grid grid-cols-4 gap-2">
                  {KINDS.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setKind(value)}
                      className={[
                        "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition",
                        kind === value
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-cream-200 text-ink-500 hover:bg-cream-100",
                      ].join(" ")}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  name="message"
                  required
                  rows={4}
                  autoFocus
                  placeholder={
                    kind === "bug"
                      ? "What broke? What were you doing when it happened?"
                      : kind === "idea"
                        ? "What would make Lagoon better for you?"
                        : "Tell us anything…"
                  }
                  className="w-full rounded-xl bg-white border border-cream-200 px-4 py-3 text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition resize-y"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email (optional — only if you want a reply)"
                  className="w-full rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition"
                />
                {status === "error" && error && (
                  <p className="text-sm text-rose-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary w-full justify-center disabled:opacity-60"
                >
                  {status === "sending" ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send to the team"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
