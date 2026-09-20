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
 * title. Linked again from the marketing nav ("Live data"), the app navbar
 * and both footers, so it is reachable by crawl and not only by sitemap.
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

/**
 * Rarity is ORDINAL, so it is one hue getting stronger — the same rule the
 * level ramp follows. It used to be four unrelated decisions, and each was
 * wrong in its own way:
 *
 *  - `text-gold-700` on `bg-gold-100`: gold-700 flips to the gold fill inside
 *    `.dark` (correct on a navy ground) while the gold-100 plate under it
 *    does not flip at all, so at night this was bright gold on pale gold —
 *    1.3:1. Ink on a painted brand plate is what `on-accent` is for: it is
 *    deliberately theme-invariant, exactly like the plate.
 *  - `text-ink-600`: there is no 600 step in the ink scale, so the class
 *    generated nothing and the count silently inherited its parent's colour.
 *  - `rose-*`: Tailwind's stock palette, not the brand's — the only
 *    non-brand hue left in the app.
 *  - epic sat on `gold-50`, a LIGHTER plate than rare's `gold-100`, so the
 *    ramp ran backwards.
 */
const RARITY_COLORS: Record<string, string> = {
  common:    "bg-cream-100 text-ink-700   border-cream-200",
  rare:      "bg-gold-100  text-on-accent border-gold-200",
  epic:      "bg-gold-200  text-on-accent border-gold-300",
  legendary: "bg-gold-400  text-on-accent border-gold-500",
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

  /* ---------- XP per action, by source ----------
     `event_count` and `avg_xp` come back in the bundle and nothing rendered
     them. Total XP answers "where does XP come from"; this answers "what is
     each action worth", which is the one a player actually acts on. */
  const rateBars = s.sources
    .filter((src) => src.event_count > 0)
    .map((src) => ({
      label: prettifySource(src.source),
      value: Math.round(src.total_xp / src.event_count),
      sub: `${src.event_count.toLocaleString()} logged`,
    }))
    .sort((a, b) => b.value - a.value);

  /* ---------- Busiest single day ----------
     `daily.active_users` was also fetched and unused. */
  const busiest = s.daily.reduce<(typeof s.daily)[number] | null>(
    (best, d) => (!best || (d.total_xp ?? 0) > (best.total_xp ?? 0) ? d : best),
    null,
  );
  const dailyAvg = s.daily.length
    ? Math.round(s.daily.reduce((a, d) => a + (d.total_xp ?? 0), 0) / s.daily.length)
    : 0;
  const busiestDate = busiest
    ? new Date(busiest.day).toLocaleDateString("en-US", {
        month: "long", day: "numeric", timeZone: "UTC",
      })
    : null;

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
      body: `${ov?.total_users ?? 0} sign-ups out of the ${UCSB_UNDERGRAD_ENROLLMENT.toLocaleString()} undergraduates in UCSB’s most recent published census (Fall 2025). Plenty of lagoon to fill.`,
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

  /* ---------- Stats that made us laugh ----------
     Every one of these is computed from the same live rows as the charts
     above — the joke is always the real number, never a number invented to
     land a joke. Each entry is conditional, so a fact disappears the moment
     the data stops supporting it rather than quietly becoming false. */
  const undeclared = s.majors.find((m) => m.major_code === "Undeclared")?.users ?? 0;
  const topDeclared = s.majors.find((m) => m.major_code !== "Undeclared");
  const emptyRarity = s.badgeRarity.filter((r) => r.available > 0 && r.earned === 0);
  const zeroStreak = streakDist.find((b) => b.bucket === "0")?.users ?? 0;
  const tiedAtTop =
    topStreaks.length > 1 && topStreaks[0].streak_days > 0
      ? topStreaks.filter((u) => u.streak_days === topStreaks[0].streak_days).length
      : 0;
  const quietest = [...s.sources]
    .filter((x) => x.event_count > 0)
    .sort((a, b) => a.event_count - b.event_count)[0];
  const weekendPeak = peakDow.label === "Sat" || peakDow.label === "Sun";

  const funFacts: { emoji: string; title: string; body: string }[] = [];

  if (undeclared > 0 && (!topDeclared || undeclared > topDeclared.users)) {
    funFacts.push({
      emoji: "🤷",
      title: "“Undeclared” is the most popular major",
      body: `${undeclared} Gauchos, against ${topDeclared?.users ?? 0} for ${topDeclared ? prettifyMajor(topDeclared.major_code) : "the runner-up"}. The single largest academic cohort on Lagoon has not picked one.`,
    });
  }

  if (emptyRarity.length) {
    // The rarity column is lowercase in the database; it is a proper tier
    // name in prose.
    const names = emptyRarity
      .map((r) => r.rarity.charAt(0).toUpperCase() + r.rarity.slice(1))
      .join(" or ");
    const count = emptyRarity.reduce((a, r) => a + r.available, 0);
    funFacts.push({
      emoji: "🫥",
      title: `Nobody has earned a single ${names} badge`,
      body: `${count} of them exist. They have been sitting there, unclaimed, since launch. Someone is going to be first.`,
    });
  }

  if (streakDistTotal > 0 && zeroStreak > 0) {
    funFacts.push({
      emoji: "💤",
      title: `${pct(zeroStreak, streakDistTotal).toFixed(0)}% of Gauchos are on a zero-day streak`,
      body: `${zeroStreak} of ${streakDistTotal} signed up, earned something, and have not been back today. We are publishing this anyway.`,
    });
  }

  if (tiedAtTop > 1) {
    funFacts.push({
      emoji: "🤝",
      title: `${tiedAtTop}-way tie for the longest streak`,
      body: `All of them at ${topStreaks[0].streak_days} days. Nobody has blinked yet, and the tiebreak is simply who opens the app tomorrow.`,
    });
  }

  if (topSource && topSourceShare >= 40) {
    funFacts.push({
      emoji: "👋",
      title: `${topSourceShare}% of all XP is just showing up`,
      body: `${prettifySource(topSource.source)} out-earns every other action on Lagoon combined. Attendance really is most of it.`,
    });
  }

  if (quietest && s.sources.length > 2) {
    funFacts.push({
      emoji: "🦗",
      title: `${prettifySource(quietest.source)} has been used ${quietest.event_count} time${quietest.event_count === 1 ? "" : "s"}`,
      body: `Total XP earned from it, ever: ${quietest.total_xp.toLocaleString()}. Every app has one of these. This is ours.`,
    });
  }

  if (weekendPeak && s.daily.length > 7) {
    funFacts.push({
      emoji: "📚",
      title: `${peakDow.label === "Sat" ? "Saturday" : "Sunday"} is the single biggest XP day`,
      body: `${peakDow.value} XP on an average ${peakDow.label}, ahead of every weekday. Draw your own conclusions about how UCSB spends its weekends.`,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 border border-gold-200 text-gold-700">
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

      {/* The lead.
          A page of twelve charts has no first sentence, so people skim it and
          leave with nothing. This says the whole state of Lagoon in one line,
          in the page's own display face, before any chart asks for attention.
          It is the same three figures as the strip below, which is the point —
          the strip is the reference, this is the read. */}
      <section className="card-tinted p-6 sm:p-8 mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
          Where Lagoon stands today
        </p>
        <p className="font-display text-[1.75rem] sm:text-4xl font-bold tracking-[-0.03em] leading-[1.15] mt-3 text-ink-900">
          <span data-live className="tabular-nums">{(ov?.total_users ?? 0).toLocaleString()}</span> Gauchos have
          signed up,{" "}
          <span data-live className="tabular-nums">{(ov?.active_users_14d ?? 0).toLocaleString()}</span> were here
          this fortnight, and together they have earned{" "}
          <span data-live className="tabular-nums">{(ov?.lifetime_xp ?? 0).toLocaleString()}</span> XP.
        </p>
        <p className="text-sm text-ink-500 mt-4 max-w-2xl leading-relaxed">
          That is{" "}
          <span data-live className="tabular-nums font-semibold text-ink-700">{adoptionPct.toFixed(2)}%</span> of
          UCSB&apos;s undergraduates. Small, early, and — unlike most launch
          numbers — exactly what the database says. Nothing on this page is
          rounded up, padded, or projected.
        </p>
      </section>

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

      {/* What an action is worth + the shape of the month.
          Both are built from fields the bundle already returned and nothing
          rendered: `event_count` on each source, and `active_users` on each
          daily row. */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">What each action is worth</h2>
            <span className="text-xs text-ink-400">XP per action</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            The chart above says where XP comes from. This says which single
            action pays best — the one worth doing on purpose.
          </p>
          {rateBars.length === 0
            ? <p className="text-sm text-ink-400">No actions logged yet.</p>
            : <BarRow items={rateBars} unit=" XP" />}
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">The month in three numbers</h2>
            <span className="text-xs text-ink-400">last 30 days</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            The peaks in the chart above, named.
          </p>
          {busiest && busiestDate ? (
            <dl className="space-y-4">
              <Figure
                label="Busiest day"
                value={busiestDate}
                foot={`${(busiest.total_xp ?? 0).toLocaleString()} XP from ${busiest.active_users ?? 0} Gauchos — ${
                  dailyAvg ? `${(busiest.total_xp / dailyAvg).toFixed(1)}×` : "well above"
                } a normal day`}
              />
              <Figure
                label="Typical day"
                value={`${dailyAvg.toLocaleString()} XP`}
                foot={`averaged across all ${s.daily.length} days with activity`}
              />
              <Figure
                label="Best day of the week"
                value={peakDow.label}
                foot={`${peakDow.value} XP on an average ${peakDow.label}`}
              />
            </dl>
          ) : (
            <p className="text-sm text-ink-400">Not enough activity yet.</p>
          )}
        </div>
      </section>

      {/* Major breakdown */}
      <section className="card p-5 mt-4">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-ink-900">Top majors</h2>
          <span className="text-xs text-ink-400">{totalProfiles} declared profiles</span>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          Major codes are UCSB’s, not friendly names — keeping them honest.
        </p>
        <BarRow items={majorBars} />
      </section>

      {/* Badges */}
      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Badge earnings by rarity</h2>
          <p className="text-xs text-ink-400 mb-4">Earned vs. how many badges of that tier exist.</p>
          <ul data-live className="space-y-3">
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
                        // Flat, and one step per rarity. These were gradients
                        // encoding rarity by hue; the system has no gradients,
                        // and rarity is ordinal so it reads better as one hue
                        // getting stronger.
                        background: r.rarity === "legendary"
                          ? "var(--color-gold-500)"
                          : r.rarity === "epic"
                          ? "var(--color-gold-600)"
                          : "var(--color-gold-700)",
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
          <ul data-live className="space-y-2">
            {s.topBadges.filter(b => b.earned_count > 0).slice(0, 6).map((b) => (
              <li
                key={b.badge_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cream-100/70 transition"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-100 border border-gold-200 text-base">
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
            <ol data-live className="space-y-2">
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
                  <span className="text-sm font-bold text-gold-700 tabular-nums">
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
            <ul data-live className="space-y-2">
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
                  <span className="text-xs font-bold text-gold-700 tabular-nums">
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

      {/* Stats that made us laugh.
          The counterweight to "Smart insights": same rows, read for what is
          funny about them rather than what is impressive. It earns its place
          by being the section that admits things — the zero-day streaks and
          the unused feature are in here precisely because a stats page that
          only flatters itself is not worth reading. */}
      {funFacts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 mb-1">
            Stats that made us laugh{" "}
            <span className="italic-accent text-lg">— all of them true.</span>
          </h2>
          <p className="text-sm text-ink-500 mb-3 max-w-2xl leading-relaxed">
            Same database as everything above. We went looking for the numbers
            that are funny rather than the ones that are flattering, and left in
            the ones that are both.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {funFacts.map((f) => (
              <div key={f.title} className="card p-5 flex gap-3">
                <span aria-hidden className="text-2xl leading-none shrink-0 mt-0.5">{f.emoji}</span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-ink-900 text-base leading-snug">{f.title}</p>
                  <p className="text-sm text-ink-500 mt-2 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-100 border border-gold-200 text-gold-700">
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
        Aggregates only — Lagoon never exposes individual user activity outside the user’s own session.
      </p>
    </div>
  );
}

/**
 * A labelled figure for "The month in three numbers".
 *
 * `data-live` sits on the value and the footnote, not the label: the label is
 * design and belongs under the visual baselines, the number underneath it
 * changes every day and would drift them.
 */
function Figure({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-ink-400 font-semibold">{label}</dt>
      <dd data-live className="font-display text-2xl font-bold text-ink-900 tabular-nums leading-tight mt-1">
        {value}
      </dd>
      <dd data-live className="text-xs text-ink-400 mt-1 leading-snug">{foot}</dd>
    </div>
  );
}
