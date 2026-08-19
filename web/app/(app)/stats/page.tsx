import type { Metadata } from "next";
import { Activity, Award, BarChart3, Flame, GraduationCap, Heart, MessageSquare, Sparkles, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { BarRow } from "@/components/charts/bar-row";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { ActivityArea } from "@/components/charts/activity-area";
import {
  getStatsBundle,
  getStreakDistribution,
  getTopStreaks,
  getTrendingClasses,
} from "@/lib/queries";
import { badgeIconToEmoji } from "@/lib/sf-symbol-emoji";
import {
  UCSB_UNDERGRAD_ENROLLMENT,
  prettifySource,
  prettifyMajor,
  normalizeClassLevel,
  pct,
} from "@/lib/stats-helpers";

export const revalidate = 120;

/**
 * Public, indexable, and listed in sitemap.ts — so it needs more than a
 * title. It is no longer linked from the marketing nav, which makes the
 * canonical + description the only things telling a crawler what it is.
 */
export const metadata: Metadata = {
  title: "Stats for nerds",
  description:
    "Lagoon's public numbers for UCSB, straight from the live database: signups, streaks, XP by source, badges, class years, majors, and trending classes. Real aggregates, nothing padded.",
  alternates: { canonical: "https://lagoonucsb.com/stats" },
  openGraph: {
    type: "website",
    title: "Stats for nerds — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, straight from the live database.",
    url: "https://lagoonucsb.com/stats",
    images: [{ url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stats for nerds — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, straight from the live database.",
    images: [{ url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
};

const RARITY_COLORS: Record<string, string> = {
  common:    "bg-cream-100 text-ink-600 border-cream-200",
  rare:      "bg-orange-100 text-orange-700 border-orange-200",
  epic:      "bg-amber-50  text-amber-700  border-amber-200",
  legendary: "bg-rose-50   text-rose-700   border-rose-200",
};

export default async function StatsPage() {
  const [s, streakDist, topStreaks, trending] = await Promise.all([
    getStatsBundle(),
    getStreakDistribution(),
    getTopStreaks(5),
    getTrendingClasses(6),
  ]);

  /* ---------- Class-level normalize + collapse ---------- */
  const classCounts = new Map<string, number>();
  for (const c of s.classLevels) {
    const k = normalizeClassLevel(c.class_level);
    classCounts.set(k, (classCounts.get(k) ?? 0) + c.users);
  }
  const classDonut = ["Freshman","Sophomore","Junior","Senior","Grad","Unknown"]
    .filter((k) => classCounts.get(k))
    .map((k) => ({ name: k, value: classCounts.get(k)! }));

  /* ---------- Major bars (top N) ---------- */
  const totalProfiles = s.majors.reduce((a, b) => a + b.users, 0);
  const majorBars = s.majors.slice(0, 10).map((m) => ({
    label: prettifyMajor(m.major_code),
    value: m.users,
    sub: `${pct(m.users, totalProfiles).toFixed(0)}%`,
  }));

  /* ---------- Source bars ---------- */
  const totalSourceXp = s.sources.reduce((a, b) => a + b.total_xp, 0);
  const sourceBars = s.sources.map((src) => ({
    label: prettifySource(src.source),
    value: src.total_xp,
    sub: `${pct(src.total_xp, totalSourceXp).toFixed(0)}% of XP`,
  }));

  /* ---------- Day-of-week activity (derived from daily) ---------- */
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dowTotals = new Array(7).fill(0) as number[];
  const dowCounts = new Array(7).fill(0) as number[];
  for (const d of s.daily) {
    const dt = new Date(d.day);
    if (isNaN(dt.getTime())) continue;
    const w = dt.getUTCDay();
    dowTotals[w] += d.total_xp ?? 0;
    dowCounts[w] += 1;
  }
  const dowBars = DOW.map((label, i) => ({
    label,
    value: dowCounts[i] ? Math.round(dowTotals[i] / dowCounts[i]) : 0,
    sub: "avg XP",
  }));
  const peakDow = dowBars.reduce((p, c) => (c.value > p.value ? c : p), dowBars[0]);

  /* ---------- Streak buckets ---------- */
  const streakDistTotal = streakDist.reduce((sum, x) => sum + x.users, 0);
  const streakBars = streakDist.map((b, i) => ({
    label: `${b.bucket} days`,
    value: b.users,
    sub: streakDistTotal ? `${pct(b.users, streakDistTotal).toFixed(0)}%` : "",
    tone: (i === streakDist.length - 1 ? "primary" : "muted") as "primary" | "muted",
  }));

  /* ---------- Smart insights ---------- */
  const ov = s.overview;
  const adoptionPct = ov ? pct(ov.total_users, UCSB_UNDERGRAD_ENROLLMENT) : 0;

  const topSource = s.sources[0];
  const topSourceShare = topSource && totalSourceXp
    ? Math.round((topSource.total_xp / totalSourceXp) * 100) : 0;

  const topMajor = s.majors.find((m) => m.major_code !== "Undeclared");
  const declaredCount = s.majors.filter((m) => m.major_code !== "Undeclared")
    .reduce((a, b) => a + b.users, 0);

  const xpPerUser = ov && ov.total_users
    ? Math.round(ov.lifetime_xp / ov.total_users) : 0;
  const eventsPerUser = ov && ov.total_users
    ? (ov.lifetime_events / ov.total_users).toFixed(1) : "0";
  const activeShare = ov && ov.total_users
    ? Math.round((ov.active_users_14d / ov.total_users) * 100) : 0;

  const insights: { title: string; body: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      title: `${activeShare}% of Lagoon users were active this fortnight`,
      body: `${ov?.active_users_14d ?? 0} of ${ov?.total_users ?? 0} signed-up Gauchos checked in or earned XP in the last 14 days.`,
      icon: Activity,
    },
    {
      title: `${prettifySource(topSource?.source ?? "—")} drives ${topSourceShare}% of all XP`,
      body: `Across ${ov?.lifetime_events.toLocaleString() ?? 0} lifetime actions, the single biggest XP source is ${prettifySource(topSource?.source ?? "—").toLowerCase()}.`,
      icon: Sparkles,
    },
    {
      title: `Average Gaucho earns ${xpPerUser.toLocaleString()} XP across ${eventsPerUser} actions`,
      body: `Lifetime totals divided across the user base. Power users skew this — the top streak is ${ov?.top_streak ?? 0} days.`,
      icon: TrendingUp,
    },
    {
      title: `Lagoon has reached ${adoptionPct.toFixed(2)}% of UCSB undergrads`,
      body: `${ov?.total_users ?? 0} sign-ups out of ~${UCSB_UNDERGRAD_ENROLLMENT.toLocaleString()} undergraduates enrolled. Plenty of lagoon to fill.`,
      icon: GraduationCap,
    },
    {
      title: topMajor
        ? `${prettifyMajor(topMajor.major_code)} is the top declared major`
        : "Most users haven't declared a major yet",
      body: topMajor
        ? `${topMajor.users} of ${declaredCount} declared users are in ${prettifyMajor(topMajor.major_code)}. ${(s.majors.find(m=>m.major_code==="Undeclared")?.users ?? 0)} more haven't picked one yet.`
        : `${(s.majors.find(m=>m.major_code==="Undeclared")?.users ?? 0)} users are still undeclared.`,
      icon: Award,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <BarChart3 className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
            Stats for nerds
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Aggregated, anonymized, and refreshed from the live database.
          </p>
        </div>
      </header>

      {/* Headline strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Lagoon Gauchos"
          value={ov?.total_users ?? 0}
          icon={Users}
          hint={`${adoptionPct.toFixed(2)}% of UCSB undergrads`}
        />
        <StatCard
          label="Active (14d)"
          value={ov?.active_users_14d ?? 0}
          icon={Activity}
          hint={`${activeShare}% retention`}
        />
        <StatCard label="Lifetime XP"     value={ov?.lifetime_xp ?? 0}    icon={Sparkles} />
        <StatCard label="Top streak"      value={`${ov?.top_streak ?? 0}d`} icon={Flame} />
      </section>

      {/* Activity over time */}
      <section className="card p-5 mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-ink-900">Activity over the last 30 days</h2>
          <span className="text-xs text-ink-400">XP (filled) · Actions (dashed)</span>
        </div>
        {s.daily.length === 0 ? (
          <p className="text-sm text-ink-400">No activity yet.</p>
        ) : (
          <ActivityArea data={s.daily} />
        )}
      </section>

      {/* Two-up: XP sources + Class levels */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">XP sources</h2>
          <p className="text-xs text-ink-400 mb-4">
            Where every XP point earned on Lagoon comes from.
          </p>
          {sourceBars.length === 0
            ? <p className="text-sm text-ink-400">No XP yet.</p>
            : <BarRow items={sourceBars} />}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Class levels</h2>
          <p className="text-xs text-ink-400 mb-4">
            Distribution of self-reported class year across all sign-ups.
          </p>
          {classDonut.length === 0
            ? <p className="text-sm text-ink-400">No class data yet.</p>
            : <>
                <Donut
                  data={classDonut}
                  centerLabel="Gauchos"
                  centerValue={classDonut.reduce((s, d) => s + d.value, 0)}
                />
                <DonutLegend data={classDonut} />
              </>}
        </div>
      </section>

      {/* Major breakdown */}
      <section className="card p-5 mt-4">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-ink-900">Top majors</h2>
          <span className="text-xs text-ink-400">{totalProfiles} declared profiles</span>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          Major codes are UCSB's, not friendly names — keeping them honest.
        </p>
        <BarRow items={majorBars} />
      </section>

      {/* Badges */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Badge earnings by rarity</h2>
          <p className="text-xs text-ink-400 mb-4">Earned vs. how many badges of that tier exist.</p>
          <ul className="space-y-3">
            {s.badgeRarity.map((r) => {
              const ratio = r.available ? Math.min(1, r.earned / (r.available * Math.max(1, ov?.total_users ?? 1))) : 0;
              return (
                <li key={r.rarity}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="font-semibold capitalize text-ink-900">{r.rarity}</span>
                    <span className="text-xs text-ink-500 tabular-nums">
                      {r.earned} earned <span className="text-ink-400">· {r.available} available</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, ratio * 100)}%`,
                        background: r.rarity === "legendary"
                          ? "linear-gradient(90deg, #ff7a59, #f08a3c)"
                          : r.rarity === "epic"
                          ? "linear-gradient(90deg, #febc11, #f08a3c)"
                          : "linear-gradient(90deg, var(--color-orange-300), var(--color-orange-500))",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Most-earned badges</h2>
          <p className="text-xs text-ink-400 mb-4">What Gauchos are actually unlocking.</p>
          <ul className="space-y-2">
            {s.topBadges.filter(b => b.earned_count > 0).slice(0, 6).map((b) => (
              <li
                key={b.badge_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cream-100/70 transition"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 border border-orange-200 text-base">
                  {badgeIconToEmoji(b.icon)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-900 truncate">{b.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">{b.rarity}</p>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${RARITY_COLORS[b.rarity] ?? RARITY_COLORS.common}`}>
                  {b.earned_count}
                </span>
              </li>
            ))}
            {s.topBadges.every(b => !b.earned_count) && (
              <li className="text-sm text-ink-400">No badges earned yet.</li>
            )}
          </ul>
        </div>
      </section>

      {/* Streaks */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">Streak distribution</h2>
            <span className="text-xs text-ink-400">all sign-ups</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            How many consecutive days Gauchos are checking into the app.
          </p>
          {streakBars.every((b) => b.value === 0) ? (
            <p className="text-sm text-ink-400">No streak data yet.</p>
          ) : (
            <BarRow items={streakBars} />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">Top streaks</h2>
            <span className="text-xs text-ink-400">live</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">Longest current consecutive-day streaks.</p>
          {topStreaks.length === 0 ? (
            <p className="text-sm text-ink-400">No streaks yet.</p>
          ) : (
            <ol className="space-y-2">
              {topStreaks.map((u, i) => (
                <li
                  key={u.user_id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cream-100/70 transition"
                >
                  <span className="w-6 text-center text-base">
                    {["🥇","🥈","🥉"][i] ?? <span className="text-sm font-bold text-ink-400 tabular-nums">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-900 truncate">
                      {u.display_name ?? "Anonymous Gaucho"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">
                      Lvl {u.level}{u.major ? ` · ${prettifyMajor(u.major)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-orange-600 tabular-nums">
                    {u.streak_days}d
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Day-of-week + Trending classes */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">When Gauchos show up</h2>
            <span className="text-xs text-ink-400">avg XP / day-of-week</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            Average XP earned by day of week across the last 30 days. Peak: <span className="font-semibold text-ink-700">{peakDow.label}</span>.
          </p>
          {s.daily.length === 0 ? (
            <p className="text-sm text-ink-400">No activity yet.</p>
          ) : (
            <BarRow items={dowBars} unit=" XP" />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">Trending classes</h2>
            <span className="text-xs text-ink-400">vibes logged</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            Courses with the most class-vibe ratings from Lagoon students.
          </p>
          {trending.length === 0 ? (
            <p className="text-sm text-ink-400">No vibes logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {trending.map((t, i) => (
                <li
                  key={t.course_key}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cream-100/70 transition"
                >
                  <span className="w-6 text-center text-sm font-bold text-ink-400 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-900 truncate font-mono text-sm">{t.course_key}</p>
                    <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">
                      {t.mood}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 tabular-nums">
                    {t.vibes} <span className="font-medium text-ink-400">vibe{t.vibes === 1 ? "" : "s"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Community engagement totals (already collected in overview) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatCard
          label="Friendships"
          value={ov?.friendships ?? 0}
          icon={Heart}
          hint="connections formed"
        />
        <StatCard
          label="Class vibes"
          value={ov?.class_vibes ?? 0}
          icon={MessageSquare}
          hint="ratings logged"
        />
        <StatCard
          label="Badges earned"
          value={ov?.badges_earned ?? 0}
          icon={Award}
          hint="lifetime"
        />
      </section>

      {/* Smart insights */}
      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 mb-3">
          Smart insights <span className="italic-accent text-lg">— what the numbers say.</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins) => {
            const Icon = ins.icon;
            return (
              <div key={ins.title} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 border border-orange-200 text-orange-600">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ink-400 font-semibold">Insight</span>
                </div>
                <p className="font-display font-bold text-ink-900 text-base leading-snug">{ins.title}</p>
                <p className="text-sm text-ink-500 mt-2 leading-relaxed">{ins.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-ink-400 mt-10 text-center">
        Aggregates only — Lagoon never exposes individual user activity outside the user's own session.
      </p>
    </div>
  );
}
