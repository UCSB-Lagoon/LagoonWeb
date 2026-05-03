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
  const color = pct > 0.65 ? "#ff9f5c" : pct > 0.4 ? "#febc11" : "#e8a04a";

  return (
    <div className="glass rounded-[1.35rem] p-5 relative overflow-hidden">
      <div className="absolute -right-14 -bottom-16 h-40 w-40 rounded-full bg-amber/10 blur-2xl" />
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-lg font-bold tracking-[-0.03em]">Campus vibe</h3>
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="relative h-4 rounded-full bg-deep/70 overflow-hidden ring-1 ring-amber/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #b26a2c, #febc11, #ff9f5c)`,
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
