import { levelDisplay, LEVEL_DISPLAY } from "@/lib/gamification/levels";

export function XpBar({ xp, level }: { xp: number; level: number }) {
  const lvl = levelDisplay(level);
  const pct = (lvl.rank - 0.5) / LEVEL_DISPLAY.length;
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2 text-sm">
        <span className="font-semibold text-ink-900">
          {lvl.emoji} {lvl.name} <span className="text-ink-400 font-normal">· Level {lvl.rank}</span>
        </span>
        <span className="text-ink-500 tabular-nums font-medium">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, pct * 100)}%`,
            background: `linear-gradient(90deg, var(--color-orange-400), var(--color-orange-500))`,
          }}
        />
      </div>
    </div>
  );
}
