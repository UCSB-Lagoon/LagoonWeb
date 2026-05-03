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
      <div className="glass rounded-2xl p-8 text-center text-mist/50">
        No XP earned this week yet — the leaderboard will fill up fast.
      </div>
    );
  }
  return (
    <ol className="space-y-1.5">
      {rows.map((r) => (
        <li
          key={r.user_id}
          className="glass rounded-xl flex items-center gap-3 px-4 py-2.5 hover:bg-lagoon-200/5 transition"
        >
          <span className="w-7 text-center font-bold text-mist/70 tabular-nums">
            {MEDAL[r.rank - 1] ?? r.rank}
          </span>
          <LevelBadge level={r.level} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{r.display_name ?? "Anonymous Gaucho"}</p>
            {r.tagline && <p className="text-xs text-mist/50 truncate">{r.tagline}</p>}
          </div>
          <span className="font-semibold text-lagoon-300 tabular-nums">
            {r.xp.toLocaleString()} XP
          </span>
        </li>
      ))}
    </ol>
  );
}
