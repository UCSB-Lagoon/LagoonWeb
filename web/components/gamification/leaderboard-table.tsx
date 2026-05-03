import { LevelBadge } from "./level-badge";

export type LeaderRow = {
  user_id: string;
  rank: number;
  xp: number;
  total_xp: number;
  level: number;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
};

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ rows }: { rows: LeaderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-200 p-8 text-center text-ink-400 text-sm">
        No XP earned this week yet — the leaderboard will fill up fast.
      </div>
    );
  }
  return (
    <ol className="divide-y divide-cream-200">
      {rows.map((r) => (
        <li
          key={r.user_id}
          className="flex items-center gap-3 px-1 py-3 hover:bg-cream-100/60 rounded-xl transition"
        >
          <span className="w-7 text-center text-lg">
            {MEDAL[r.rank - 1] ?? <span className="text-sm font-bold text-ink-400 tabular-nums">{r.rank}</span>}
          </span>
          <LevelBadge level={r.level} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 truncate">{r.display_name ?? "Anonymous Gaucho"}</p>
            {r.tagline && <p className="text-xs text-ink-400 truncate uppercase tracking-wide">{r.tagline}</p>}
          </div>
          <span className="font-bold text-orange-600 tabular-nums">
            {r.xp.toLocaleString()} <span className="text-xs text-ink-400 font-medium">XP</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
