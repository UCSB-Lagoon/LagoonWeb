"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "submitting" | "ok" | "error";

export function CaptainForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot
    if ((data as { website?: string }).website) {
      setStatus("ok");
      return;
    }

    try {
      const res = await fetch("/api/captains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Couldn't submit — try again?");
      }
      setStatus("ok");
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...a: unknown[]) => void }).gtag(
          "event", "form_submit", { form_name: "captains_apply", page_path: location.pathname, send_to: "G-5HY7LBXP8G" }
        );
      }
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="text-center py-8">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-gold-500 text-on-accent mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="mt-5 font-display font-bold text-2xl text-ink-900">You&apos;re in our inbox.</h3>
        <p className="mt-2 text-ink-500">
          We&apos;ll read it personally and reply within 48 hours. Watch for an email from <span className="font-mono">team@lagoonucsb.com</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off"
        className="hidden" aria-hidden="true" />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="name" label="Your name" placeholder="Jordan Gaucho" required />
        <Field name="email" type="email" label="UCSB email" placeholder="jgaucho@ucsb.edu" required />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="year" label="Year" placeholder="3rd year" required />
        <Field name="major" label="Major" placeholder="Econ + CS" required />
      </div>

      <Field name="instagram" label="Instagram handle (optional)" placeholder="@jordan.gaucho" />

      <Textarea
        name="pitch"
        label="What's your campus network? Be specific."
        placeholder="I'm rush chair for {{house}}, my class group chat is 80 people, I do IV story takeovers most Thursdays..."
        required
      />

      <Textarea
        name="why"
        label="Why do you want to do this? One sentence is fine."
        placeholder="I’d love to help my classmates find useful campus tools."
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? (
            <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> <span>Sending…</span></>
          ) : (
            <><span>Send application</span> <Send className="w-4 h-4" aria-hidden="true" /></>
          )}
        </button>
        <p className="text-xs text-ink-400">No spam. We&apos;ll only email about your application.</p>
      </div>

      {status === "error" && error && (
        <div className="flex items-start gap-2 text-sm text-danger-ink bg-danger-50 border border-danger-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </form>
  );
}

function Field({
  name, label, type = "text", placeholder, required,
}: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] font-semibold text-ink-400 mb-1.5 block">
        {label}{required && <span className="text-gold-700"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl bg-panel-elevated border border-cream-200 px-4 py-3 text-ink-900 placeholder:text-ink-400
          focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-100 transition"
      />
    </label>
  );
}

function Textarea({
  name, label, placeholder, required,
}: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] font-semibold text-ink-400 mb-1.5 block">
        {label}{required && <span className="text-gold-700"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl bg-panel-elevated border border-cream-200 px-4 py-3 text-ink-900 placeholder:text-ink-400
          focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-100 transition resize-y"
      />
    </label>
  );
}
