import { Target } from "lucide-react";
import { getActiveChallenges } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Weekly challenges" };

export default async function ChallengesPage() {
  const challenges = await getActiveChallenges();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral-400/10 text-coral-400 ring-1 ring-coral-400/15">
          <Target className="w-6 h-6" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em]">This week's challenges</h1>
      </header>
      {challenges.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-mist/50">
          No challenges configured for this week. Check back Monday.
        </div>
      ) : (
        <ul className="space-y-3">
          {challenges.map((c) => (
            <li key={c.id} className="glass rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl">{c.title}</h2>
                <span className="text-sm font-bold text-amber tabular-nums">
                  +{c.xp_reward} XP
                </span>
              </div>
              <p className="text-mist/60 mt-1">{c.description}</p>
              <p className="text-xs text-mist/40 mt-3 uppercase tracking-wide">
                Goal: {c.target_count} × {c.target_source}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
