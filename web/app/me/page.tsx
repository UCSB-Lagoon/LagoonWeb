import { redirect } from "next/navigation";
import { Flame, Sparkles, Trophy, Star } from "lucide-react";
import { LevelBadge } from "@/components/gamification/level-badge";
import { XpBar } from "@/components/gamification/xp-bar";
import { StatCard } from "@/components/ui/stat-card";
import { XpTrend } from "@/components/charts/xp-trend";
import { getMe } from "@/lib/queries";
import { badgeIconToEmoji } from "@/lib/sf-symbol-emoji";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your lagoon" };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MePage() {
  const me = await getMe();
  if (!me) redirect("/login");

  const xp     = me.stats?.xp_total ?? 0;
  const level  = me.stats?.level ?? 1;
  const streak = me.stats?.streak_days ?? 0;

  const buckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    buckets.set(d.toDateString(), 0);
  }
  for (const e of me.weekXp) {
    const k = new Date(e.created_at); k.setHours(0,0,0,0);
    const key = k.toDateString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (e.xp_awarded ?? 0));
  }
  const trend = Array.from(buckets.entries()).map(([k, v]) => ({
    day: DAY_LABELS[new Date(k).getDay()],
    xp: v,
  }));
  const xpThisWeek = trend.reduce((s, p) => s + p.xp, 0);

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 space-y-6">
      <header className="flex items-center gap-5">
        <LevelBadge level={level} size="lg" />
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
            {me.profile?.display_name ?? me.profile?.full_name ?? "Welcome, Gaucho"}
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {me.profile?.major_code ? `${me.profile.major_code} · ` : ""}
            {me.user.email}
          </p>
        </div>
      </header>

      <div className="card p-5">
        <XpBar xp={xp} level={level} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total XP"        value={xp}              icon={Sparkles} />
        <StatCard label="XP this week"    value={xpThisWeek}      icon={Star} />
        <StatCard label="Current streak"  value={`${streak}d`}    icon={Flame} />
        <StatCard label="Badges earned"   value={me.badges.length} icon={Trophy} />
      </div>

      <XpTrend data={trend} />

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900 mb-4">Badges</h2>
        {me.badges.length === 0 ? (
          <p className="text-ink-400 text-sm">No badges yet — earn one in the mobile app.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {me.badges.map((b: any) => {
              const cat = b.badge_catalog;
              return (
                <li key={b.badge_id} className="rounded-xl p-4 bg-cream-100 border border-cream-200 text-center">
                  <div className="text-3xl">{badgeIconToEmoji(cat?.icon)}</div>
                  <div className="text-sm font-bold text-ink-900 mt-1.5">{cat?.title ?? b.badge_id}</div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mt-0.5">
                    {cat?.rarity}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
