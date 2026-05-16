import { Target } from "lucide-react";
import { getActiveChallenges } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Weekly challenges" };

const SOURCE_LABEL: Record<string, string> = {
  daily_check_in:   "daily check-ins",
  class_vibe:       "class vibes",
  schedule_add:     "schedule edits",
  planner_progress: "planner steps",
  friend_request:   "friend requests",
};

export default async function ChallengesPage() {
  const challenges = await getActiveChallenges();
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <Target className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">This week's challenges</h1>
          <p className="text-sm text-ink-500 mt-0.5">Complete to claim bonus XP</p>
        </div>
      </header>
      {challenges.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">
          No challenges configured for this week. Check back Monday.
        </div>
      ) : (
        <ul className="space-y-3">
          {challenges.map((c) => (
            <li key={c.id} className="card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-ink-900">{c.title}</h2>
                <span className="text-sm font-bold text-orange-600 tabular-nums">
                  +{c.xp_reward} XP
                </span>
              </div>
              <p className="text-ink-500 mt-1.5">{c.description}</p>
              <p className="text-xs text-ink-400 mt-4 uppercase tracking-[0.18em] font-semibold">
                Goal · {c.target_count} {SOURCE_LABEL[c.target_source] ?? c.target_source}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
