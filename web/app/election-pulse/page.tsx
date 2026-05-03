import { Vote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTotalElectionVotes } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Election Pulse" };

type Race = {
  race_key: string;
  election_slug: string;
  race_title: string;
  total_votes: number;
};
type Candidate = {
  race_key: string;
  election_slug: string;
  candidate_name: string;
  vote_count: number;
};

export default async function ElectionPulsePage() {
  const sb = (await createClient()) as any;
  const [{ data: races }, { data: cands }, total] = await Promise.all([
    sb.from("election_pulse_race_totals")
      .select("race_key, election_slug, race_title, total_votes")
      .order("total_votes", { ascending: false }),
    sb.from("election_pulse_candidate_totals")
      .select("race_key, election_slug, candidate_name, vote_count")
      .order("vote_count", { ascending: false }),
    getTotalElectionVotes(),
  ]);

  const candByRace = new Map<string, Candidate[]>();
  for (const c of (cands ?? []) as Candidate[]) {
    const k = `${c.election_slug}::${c.race_key}`;
    const arr = candByRace.get(k) ?? [];
    arr.push(c);
    candByRace.set(k, arr);
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <Vote className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Election Pulse</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {total.toLocaleString()} student votes · {races?.length ?? 0} races
          </p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {((races ?? []) as Race[]).map((race) => {
          const list = (candByRace.get(`${race.election_slug}::${race.race_key}`) ?? []).slice(0, 5);
          const total = race.total_votes || list.reduce((s, c) => s + c.vote_count, 0) || 1;
          return (
            <div key={`${race.election_slug}-${race.race_key}`} className="card p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-display font-bold text-ink-900">{race.race_title}</h2>
                <span className="text-xs text-ink-400 tabular-nums font-semibold">
                  {race.total_votes.toLocaleString()} votes
                </span>
              </div>
              <ol className="mt-3 space-y-2.5">
                {list.map((c, i) => (
                  <li key={c.candidate_name}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className={i === 0 ? "font-bold text-ink-900" : "font-medium text-ink-700"}>
                        {c.candidate_name}
                      </span>
                      <span className="text-xs text-ink-500 tabular-nums">
                        {c.vote_count} · {((c.vote_count / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (c.vote_count / total) * 100)}%`,
                          background: i === 0
                            ? "linear-gradient(90deg, var(--color-orange-400), var(--color-orange-600))"
                            : "var(--color-orange-200)",
                        }}
                      />
                    </div>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="text-sm text-ink-400">No candidates yet.</li>
                )}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
