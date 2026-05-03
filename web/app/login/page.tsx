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
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md">
        <div className="flex items-center gap-2 font-display text-xl mb-6">
          <Waves className="w-5 h-5 text-lagoon-400" />
          <span>Sign in to Lagoon</span>
        </div>
        {sent ? (
          <p className="text-mist/70">
            Magic link sent to <span className="text-mist">{email}</span>. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-mist/70">UCSB email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ucsb.edu"
                className="mt-1 w-full bg-lagoon-950/60 border border-lagoon-200/10 rounded-xl px-3 py-2.5 outline-none focus:border-lagoon-400"
              />
            </label>
            {error && <p className="text-sm text-coral-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lagoon-400 text-deep px-4 py-2.5 font-semibold hover:bg-lagoon-300 disabled:opacity-50 transition glow-lagoon"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
            <p className="text-xs text-mist/40 text-center">
              Same account as the Lagoon mobile app.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
