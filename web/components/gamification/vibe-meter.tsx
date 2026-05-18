"use client";

import { motion } from "framer-motion";

export function VibeMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const label =
    pct > 0.85 ? "Electric"   :
    pct > 0.65 ? "Buzzing"    :
    pct > 0.40 ? "Steady"     :
    pct > 0.20 ? "Mellow"     : "Quiet";

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-lg font-bold text-ink-900">Campus vibe</h3>
        <span className="text-sm font-bold text-orange-600">{label}</span>
      </div>
      <div
        className="h-3 rounded-full bg-cream-100 overflow-hidden border border-cream-200"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Campus vibe: ${label}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--color-amber-400), var(--color-orange-500), var(--color-orange-600))",
          }}
        />
      </div>
      <p className="mt-2.5 text-xs text-ink-500">
        Live signal from check-ins, ratings, and event activity over the last hour.
      </p>
    </div>
  );
}
