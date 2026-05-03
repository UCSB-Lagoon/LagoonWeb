"use client";

import { useState } from "react";
import { Waves } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <div className="card p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white">
            <Waves className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Sign in to Lagoon</h1>
            <p className="text-xs text-ink-400">Same account as the mobile app</p>
          </div>
        </div>
        {sent ? (
          <p className="text-ink-700">
            Magic link sent to <span className="font-semibold text-ink-900">{email}</span>. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">UCSB email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ucsb.edu"
                className="mt-1.5 w-full bg-cream-50 border border-cream-200 rounded-xl px-3.5 py-2.5 text-ink-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
