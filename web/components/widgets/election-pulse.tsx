import { Vote } from "lucide-react";
import type { ElectionPulseRace } from "@/lib/queries";

export function ElectionPulseCard({
  race,
  totalVotes,
}: {
  race: ElectionPulseRace | null;
  totalVotes: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 border border-orange-200 text-orange-600">
            <Vote className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900 leading-tight">Election Pulse</h3>
            <p className="text-xs text-ink-400">{totalVotes.toLocaleString()} student votes cast</p>
          </div>
        </div>
        <span className="pill !text-[10px] !py-1.5 !px-3">Live</span>
      </div>

      {!race ? (
        <p className="text-sm text-ink-400">No active races right now.</p>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400 font-semibold mb-1.5">
            Top race · {race.total_votes.toLocaleString()} votes
          </p>
          <h4 className="font-display font-bold text-ink-900 mb-3">{race.race_title}</h4>
          <ol className="space-y-2.5">
            {race.candidates.map((c, i) => (
              <li key={c.candidate_name}>
                <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
                  <span className={i === 0 ? "font-bold text-ink-900" : "font-medium text-ink-700"}>
                    {c.candidate_name}
                  </span>
                  <span className="tabular-nums text-ink-500 text-xs">
                    {c.vote_count} <span className="text-ink-400">· {(c.pct * 100).toFixed(0)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, c.pct * 100)}%`,
                      background:
                        i === 0
                          ? "linear-gradient(90deg, var(--color-orange-400), var(--color-orange-600))"
                          : "var(--color-orange-200)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
