import { redirect } from "next/navigation";
import { Flame, Sparkles, Trophy, Star } from "lucide-react";
import { LevelBadge } from "@/components/gamification/level-badge";
import { XpBar } from "@/components/gamification/xp-bar";
import { StatCard } from "@/components/ui/stat-card";
import { XpTrend } from "@/components/charts/xp-trend";
import { getMe } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your lagoon" };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MePage() {
  const me = await getMe();
  if (!me) redirect("/login");

  const xp     = me.stats?.xp_total ?? 0;
  const level  = me.stats?.level ?? 1;
  const streak = me.stats?.streak_days ?? 0;

  // bucket the last 7 days of XP into a sparkline
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
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="flex items-center gap-5">
        <LevelBadge level={level} size="lg" />
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em]">
            {me.profile?.display_name ?? me.profile?.full_name ?? "Welcome, Gaucho"}
          </h1>
          <p className="text-mist/60">
            {me.profile?.major_code ? `${me.profile.major_code} · ` : ""}
            {me.user.email}
          </p>
        </div>
      </header>

      <div className="glass rounded-2xl p-5">
        <XpBar xp={xp} level={level} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total XP"        value={xp}            icon={Sparkles} accent="#febc11" />
        <StatCard label="XP this week"    value={xpThisWeek}    icon={Star}     accent="#ff9f5c" />
        <StatCard label="Current streak"  value={`${streak}d`}  icon={Flame}    accent="#c44e2d" />
        <StatCard label="Badges earned"   value={me.badges.length} icon={Trophy} accent="#f0f4ff" />
      </div>

      <XpTrend data={trend} />

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg mb-4">Badges</h2>
        {me.badges.length === 0 ? (
          <p className="text-mist/50 text-sm">No badges yet — earn one in the mobile app.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {me.badges.map((b: any) => {
              const cat = b.badge_catalog;
              return (
                <li key={b.badge_id} className="rounded-xl p-3 bg-lagoon-200/5 text-center">
                  <div className="text-3xl">{cat?.icon ?? "🏅"}</div>
                  <div className="text-sm font-medium mt-1">{cat?.title ?? b.badge_id}</div>
                  <div className="text-xs text-mist/50 capitalize">{cat?.rarity}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
