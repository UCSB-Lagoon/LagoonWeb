import { levelDisplay, LEVEL_DISPLAY } from "@/lib/gamification/levels";

/**
 * Renders the user's current level + total XP. We don't draw a "to next level"
 * progress bar because the canonical XP-per-level curve lives in the mobile app
 * and isn't exposed here. The bar shows relative progress through the visible
 * level range (1..N), which is honest and looks great.
 */
export function XpBar({ xp, level }: { xp: number; level: number }) {
  const lvl = levelDisplay(level);
  const pct = (lvl.rank - 0.5) / LEVEL_DISPLAY.length;
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5 text-sm">
        <span className="font-medium text-mist">
          {lvl.emoji} {lvl.name} · Level {lvl.rank}
        </span>
        <span className="text-mist/60 tabular-nums">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-3 rounded-full bg-deep/70 overflow-hidden ring-1 ring-amber/10">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, pct * 100)}%`,
            background: `linear-gradient(90deg, ${lvl.color}, #febc11, #ff9f5c)`,
            boxShadow: `0 0 16px -2px ${lvl.color}`,
          }}
        />
      </div>
    </div>
  );
}
