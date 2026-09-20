import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { getStatsBundle, getWeeklyLeaderboard } from "@/lib/queries";
import { UCSB_UNDERGRAD_ENROLLMENT, prettifySource, pct } from "@/lib/stats-helpers";

/**
 * "Proof first" — the homepage leads with the live database.
 *
 * The argument: the current hero sells a feature ("your schedule, beautiful in
 * 30 seconds") that every campus app claims, and backs it with a drawn phone.
 * At week 0 the genuinely uncommon thing Lagoon has is that it publishes real
 * aggregates at a scale where they are unflattering. Smallness read as honesty
 * is a position competitors can't copy without also being small.
 *
 * Deliberately shows 142 as 142. Per the standing rule, no synthetic floor and
 * no "1,000+" rounding — if the number can't carry the page, the concept is
 * wrong and should be killed here rather than after it ships.
 */
export async function ProofConcept() {
  const [s, top] = await Promise.all([getStatsBundle(), getWeeklyLeaderboard(5)]);
  const ov = s.overview;
  const reach = ov ? pct(ov.total_users, UCSB_UNDERGRAD_ENROLLMENT) : 0;
  const totalSourceXp = s.sources.reduce((a, b) => a + b.total_xp, 0);
  const topSource = s.sources[0];

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-700 font-bold">
        Built at UCSB · week one
      </p>

      <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-[-0.03em] leading-[0.98] mt-5 max-w-3xl">
        <span data-live className="inline-block tabular-nums">{ov?.total_users ?? 0}</span> Gauchos
        have signed up.
        <br />
        <span className="text-ink-500">We publish the rest of the numbers too.</span>
      </h1>

      <p className="text-lg text-ink-500 mt-6 max-w-xl leading-relaxed">
        That is <span data-live className="tabular-nums font-semibold text-ink-900">{reach.toFixed(2)}%</span> of
        UCSB undergrads — small, and real. Every figure on this site comes
        straight from the live database, refreshed every two minutes. Nothing is
        rounded up, and nothing is invented.
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-8">
        <Link href="/stats" className="btn-primary inline-flex items-center gap-2">
          See every number <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/hub" className="btn-secondary">Open the live hub</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-12">
        <Tile
          value={ov?.active_users_14d ?? 0}
          label="active in the last 14 days"
          foot={ov?.total_users ? `${Math.round((ov.active_users_14d / ov.total_users) * 100)}% of sign-ups came back` : ""}
        />
        <Tile
          value={ov?.lifetime_xp ?? 0}
          label="XP earned, all time"
          foot={topSource && totalSourceXp
            ? `${prettifySource(topSource.source)} is ${Math.round((topSource.total_xp / totalSourceXp) * 100)}% of it`
            : ""}
        />
        <Tile
          value={`${ov?.top_streak ?? 0}d`}
          label="longest current streak"
          foot="one person, checking in daily"
        />
      </div>

      <div className="card p-5 mt-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg font-bold">This week&apos;s top five</h2>
          <Link href="/leaderboard" className="text-sm font-semibold text-gold-700 hover:underline">
            Full leaderboard →
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="text-sm text-ink-400">No XP earned yet this week.</p>
        ) : (
          <ol data-live className="divide-y divide-cream-200">
            {top.map((r, i) => (
              <li key={r.user_id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 text-center text-sm font-bold text-ink-400 tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0 font-semibold truncate">
                  {r.display_name ?? "Anonymous Gaucho"}
                </span>
                <span className="text-sm font-bold text-gold-700 tabular-nums">
                  {r.xp.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-400 mt-8">
        <Flame className="w-3.5 h-3.5 text-gold-700" />
        Every number on this page is a live query. Reload it and watch.
      </p>
    </div>
  );
}

function Tile({ value, label, foot }: { value: number | string; label: string; foot?: string }) {
  return (
    <div className="card p-5">
      <div data-live className="font-display text-[2.4rem] leading-none font-bold tabular-nums tracking-[-0.03em]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-ink-500 mt-2">{label}</div>
      {foot && <div className="text-xs text-ink-400 mt-2 leading-snug">{foot}</div>}
    </div>
  );
}
