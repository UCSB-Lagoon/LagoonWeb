"use client";

import { motion } from "framer-motion";

/**
 * Campus "vibe" — a single normalized score derived from recent xp_events
 * activity in the last hour vs. the trailing 24h average.
 */
export function VibeMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const label =
    pct > 0.85 ? "Electric"   :
    pct > 0.65 ? "Buzzing"    :
    pct > 0.40 ? "Steady"     :
    pct > 0.20 ? "Mellow"     : "Quiet";
  const color = pct > 0.65 ? "#fb7185" : pct > 0.4 ? "#22d3ee" : "#4ade80";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-lg">Campus vibe</h3>
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="relative h-4 rounded-full bg-lagoon-950/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #4ade80, #22d3ee, #fb7185)`,
            boxShadow: `0 0 24px ${color}66`,
          }}
        />
      </div>
      <p className="mt-2 text-xs text-mist/50">
        Updates live from check-ins, ratings, and event activity.
      </p>
    </div>
  );
}
