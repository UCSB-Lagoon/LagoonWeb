import { CampusHeading, CampusNav } from "@/components/campus-heading";
import { getActiveChallenges } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Weekly challenges", alternates: { canonical: "/challenges" } };

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
    <div className="campus-page">
      <CampusHeading eyebrow="A LITTLE EXTRA MOTIVATION" title="This week’s challenges" description="Complete challenges in Lagoon to earn bonus XP." />
      <CampusNav current="/challenges" />
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
                <span className="text-sm font-bold text-gold-700 tabular-nums">
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
