// Rows come from public_leaderboard() (iOS repo, migration 086): ranked by
// days someone opened Lagoon, then by how often. Only `days` is published.
export type LeaderRow = {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  major: string | null;
  days: number;
};

const MEDAL = ["🥇", "🥈", "🥉"];

function initials(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}

export function LeaderboardTable({ rows, period = "week" }: { rows: LeaderRow[]; period?: "week" | "all" }) {
  if (rows.length === 0) {
    return (
      <div data-live className="rounded-2xl border border-dashed border-cream-200 p-8 text-center text-ink-400 text-sm">
        {period === "week"
          ? "The week just reset. Open Lagoon today to take the top spot."
          : "Nobody on the board yet."}
      </div>
    );
  }
  return (
    <ol data-live className="divide-y divide-cream-200">
      {rows.map((r) => (
        <li key={r.user_id} className="flex items-center gap-3 px-1 py-3 hover:bg-cream-100/60 rounded-xl transition">
          <span className="w-7 text-center text-lg">
            {MEDAL[r.rank - 1] ?? <span className="text-sm font-bold text-ink-400 tabular-nums">{r.rank}</span>}
          </span>
          <span aria-hidden="true"
                className="grid h-9 w-9 flex-none place-items-center rounded-full bg-cream-100 text-xs font-bold text-ink-700 border border-cream-200">
            {initials(r.display_name)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 truncate">{r.display_name ?? "A Gaucho"}</p>
            {r.major && <p className="text-xs text-ink-400 truncate">{r.major}</p>}
          </div>
          {period === "week" && (
            <span className="hidden sm:flex gap-1" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <i key={i} className={`h-2.5 w-2.5 rounded-full ${i < r.days ? "bg-[var(--chart-1)]" : "bg-cream-200"}`} />
              ))}
            </span>
          )}
          <span className="w-16 text-right font-bold text-ink-900 tabular-nums">
            {r.days} <span className="text-xs text-ink-400 font-medium">{r.days === 1 ? "day" : "days"}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
