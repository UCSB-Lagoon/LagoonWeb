import type { Metadata } from "next";
import { Activity, Award, BarChart3, Flame, GraduationCap, Heart, MessageSquare, Sparkles, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { BarRow } from "@/components/charts/bar-row";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { ActivityArea } from "@/components/charts/activity-area";
import { SignupTrend } from "@/components/charts/signup-trend";
import {
  getSignupSeries,
  getStatsBundle,
  getStreakDistribution,
  getTopStreaks,
  getTrendingClasses,
} from "@/lib/queries";
import { badgeIconToEmoji } from "@/lib/sf-symbol-emoji";
import {
  STATS_WINDOW_DAYS,
  UCSB_UNDERGRAD_ENROLLMENT,
  delta,
  fillActivity,
  formatIsoDate,
  laCalendarDays,
  pct,
  prettifyMajor,
  prettifySource,
  normalizeClassLevel,
  sliceWindow,
  sumBy,
  utcWeekday,
  type Delta,
} from "@/lib/stats-helpers";

// Keep equal to STATS_REVALIDATE_SECONDS. Next requires a literal here.
export const revalidate = 30;

/**
 * Public, indexable, and listed in sitemap.ts — so it needs more than a
 * title. Linked again from the marketing nav ("Live data"), the app navbar
 * and both footers, so it is reachable by crawl and not only by sitemap.
 */
export const metadata: Metadata = {
  title: "Stats for nerds",
  description:
    "Lagoon's public numbers for UCSB, straight from the live database: signups, week-over-week growth, streaks, XP by source, badges, class years, majors, and trending classes.",
  alternates: { canonical: "https://lagoonucsb.com/stats" },
  openGraph: {
    type: "website",
    title: "Stats for nerds — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, including how this week compares with the last.",
    url: "https://lagoonucsb.com/stats",
    images: [{ url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stats for nerds — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, including how this week compares with the last.",
    images: [{ url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
};

/**
 * Rarity is ORDINAL, so it is one hue getting stronger — the same rule the
 * level ramp follows. Ink on a painted gold plate uses `on-accent`, which
 * stays readable in both themes.
 */
const RARITY_COLORS: Record<string, string> = {
  common:    "bg-cream-100 text-ink-700   border-cream-200",
  rare:      "bg-gold-100  text-on-accent border-gold-200",
  epic:      "bg-gold-200  text-on-accent border-gold-300",
  legendary: "bg-gold-400  text-on-accent border-gold-500",
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StatsPage() {
  const days = laCalendarDays(STATS_WINDOW_DAYS);
  const [s, streakDist, streaks, trending, signups] = await Promise.all([
    getStatsBundle(),
    getStreakDistribution(),
    getTopStreaks(5),
    getTrendingClasses(6),
    getSignupSeries(days),
  ]);
  const topStreaks = streaks.leaders;

  const daily = fillActivity(
    s.daily.map((d) => ({
      day: d.day,
      event_count: d.event_count ?? 0,
      active_users: d.active_users ?? 0,
      total_xp: d.total_xp ?? 0,
    })),
    days,
  );
  const thisWeek = sliceWindow(daily, 7, 0);
  const prevWeek = sliceWindow(daily, 7, 7);
  const xpThis = sumBy(thisWeek, (d) => d.total_xp);
  const xpPrev = sumBy(prevWeek, (d) => d.total_xp);
  const xpDelta = delta(xpThis, xpPrev);
  const actionsThis = sumBy(thisWeek, (d) => d.event_count);
  const actionsPrev = sumBy(prevWeek, (d) => d.event_count);
  const actionsDelta = delta(actionsThis, actionsPrev);
  const activeThis = Math.round(sumBy(thisWeek, (d) => d.active_users) / Math.max(1, thisWeek.length));
  const activePrev = Math.round(sumBy(prevWeek, (d) => d.active_users) / Math.max(1, prevWeek.length));
  const activeDelta = delta(activeThis, activePrev);

  const signupThis = signups ? sumBy(sliceWindow(signups, 7, 0), (d) => d.signups) : null;
  const signupPrev = signups ? sumBy(sliceWindow(signups, 7, 7), (d) => d.signups) : null;
  const signupDelta = signupThis !== null && signupPrev !== null ? delta(signupThis, signupPrev) : null;
  const signupTotal = signups ? sumBy(signups, (d) => d.signups) : 0;
  let running = 0;
  const signupPoints = (signups ?? []).map((d) => {
    running += d.signups;
    return { day: d.day, signups: d.signups, cumulative: running };
  });

  /* ---------- Class-level normalize + collapse ---------- */
  const classCounts = new Map<string, number>();
  for (const c of s.classLevels) {
    const k = normalizeClassLevel(c.class_level);
    classCounts.set(k, (classCounts.get(k) ?? 0) + c.users);
  }
  const classDonut = ["Freshman", "Sophomore", "Junior", "Senior", "Grad", "Unknown"]
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

  /* ---------- Day-of-week, including days with zero XP ---------- */
  const dowTotals = new Array(7).fill(0) as number[];
  const dowCounts = new Array(7).fill(0) as number[];
  for (const d of daily) {
    const w = utcWeekday(d.day);
    dowTotals[w] += d.total_xp;
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

  const rateBars = s.sources
    .filter((src) => src.event_count > 0)
    .map((src) => ({
      label: prettifySource(src.source),
      value: Math.round(src.total_xp / src.event_count),
      sub: `${src.event_count.toLocaleString()} logged`,
    }))
    .sort((a, b) => b.value - a.value);

  const busiest = daily.reduce<(typeof daily)[number] | null>(
    (best, d) => (!best || d.total_xp > best.total_xp ? d : best),
    null,
  );
  const dailyAvg = daily.length
    ? Math.round(daily.reduce((a, d) => a + d.total_xp, 0) / daily.length)
    : 0;
  const busiestDate = busiest && busiest.total_xp > 0
    ? formatIsoDate(busiest.day, { month: "long", day: "numeric" })
    : null;

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
  const hasActivity = daily.some((d) => d.total_xp > 0 || d.event_count > 0);

  const growthLine = growthSentence(xpThis, xpPrev, xpDelta);

  const insights: { title: string; body: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      title: growthTitle(xpDelta),
      body: `${xpThis.toLocaleString()} XP across ${actionsThis.toLocaleString()} actions in the last 7 days, against ${xpPrev.toLocaleString()} XP the week before. Lifetime, the average Gaucho has ${xpPerUser.toLocaleString()} XP from ${eventsPerUser} actions.`,
      icon: TrendingUp,
    },
    {
      title: `${activeShare}% of Lagoon users were active in the last 14 days`,
      body: `${ov?.active_users_14d ?? 0} of ${ov?.total_users ?? 0} signed-up Gauchos have a last-active time inside that window. That is a stock, not a retention rate.`,
      icon: Activity,
    },
    {
      title: `${prettifySource(topSource?.source ?? "—")} drives ${topSourceShare}% of all XP`,
      body: `Across ${(ov?.lifetime_events ?? 0).toLocaleString()} lifetime actions, the single biggest XP source is ${prettifySource(topSource?.source ?? "—").toLowerCase()}.`,
      icon: Sparkles,
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
        ? `${topMajor.users} of ${declaredCount} declared users are in ${prettifyMajor(topMajor.major_code)}. ${(s.majors.find((m) => m.major_code === "Undeclared")?.users ?? 0)} more haven't picked one yet.`
        : `${(s.majors.find((m) => m.major_code === "Undeclared")?.users ?? 0)} users are still undeclared.`,
      icon: Award,
    },
  ];

  const undeclared = s.majors.find((m) => m.major_code === "Undeclared")?.users ?? 0;
  const topDeclared = s.majors.find((m) => m.major_code !== "Undeclared");
  const emptyRarity = s.badgeRarity.filter((r) => r.available > 0 && r.earned === 0);
  const zeroStreak = streakDist.find((b) => b.bucket === "0")?.users ?? 0;
  const tiedAtTop = streaks.tiedAtTop;
  const quietest = [...s.sources]
    .filter((x) => x.event_count > 0)
    .sort((a, b) => a.event_count - b.event_count)[0];
  const weekendPeak = peakDow.value > 0 && (peakDow.label === "Sat" || peakDow.label === "Sun");

  const funFacts: { emoji: string; title: string; body: string }[] = [];

  if (undeclared > 0 && (!topDeclared || undeclared > topDeclared.users)) {
    funFacts.push({
      emoji: "🤷",
      title: "“Undeclared” is the most popular major",
      body: `${undeclared} Gauchos, against ${topDeclared?.users ?? 0} for ${topDeclared ? prettifyMajor(topDeclared.major_code) : "the runner-up"}. The single largest academic cohort on Lagoon has not picked one.`,
    });
  }

  if (emptyRarity.length) {
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
      body: `${zeroStreak} of ${streakDistTotal} profiles have a streak of zero. That includes people who have not checked in, and people whose streak already broke.`,
    });
  }

  if (tiedAtTop > 1) {
    funFacts.push({
      emoji: "🤝",
      title: `${tiedAtTop}-way tie for the longest streak`,
      body: `All of them at ${topStreaks[0].streak_days} days. Nobody has blinked yet, and the tiebreak is simply who opens the app tomorrow.`,
    });
  }

  if (topSource?.source === "daily_check_in" && topSourceShare >= 40) {
    funFacts.push({
      emoji: "👋",
      title: `${topSourceShare}% of all XP is just showing up`,
      body: topSourceShare > 50
        ? "Daily check-in is more than half of all XP on Lagoon."
        : `Daily check-in is the single largest source. Everything else splits the remaining ${100 - topSourceShare}%.`,
    });
  }

  if (quietest && s.sources.length > 2) {
    funFacts.push({
      emoji: "🦗",
      title: `${prettifySource(quietest.source)} has been used ${quietest.event_count} time${quietest.event_count === 1 ? "" : "s"}`,
      body: `Total XP earned from it, ever: ${quietest.total_xp.toLocaleString()}. Every app has one of these. This is ours.`,
    });
  }

  if (weekendPeak) {
    funFacts.push({
      emoji: "📚",
      title: `${peakDow.label === "Sat" ? "Saturday" : "Sunday"} is the biggest XP day`,
      body: `${peakDow.value.toLocaleString()} XP on an average ${peakDow.label}, ahead of every weekday. Quiet days are included in that average.`,
    });
  }

  const maxEarned = Math.max(1, ...s.badgeRarity.map((r) => r.earned));

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 border border-gold-200 text-gold-700">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
              Stats for nerds
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">
              Aggregated and anonymized. Nothing on this page is rounded up.
            </p>
          </div>
        </div>
        <p className="pill">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-700" aria-hidden />
          Live · every 30 seconds
        </p>
      </header>

      <section className="card-tinted p-6 sm:p-8 mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
          Where Lagoon stands today
        </p>
        <p className="font-display text-[1.75rem] sm:text-4xl font-bold tracking-[-0.03em] leading-[1.15] mt-3 text-ink-900">
          <span data-live className="tabular-nums">{(ov?.total_users ?? 0).toLocaleString()}</span> Gauchos have
          signed up,{" "}
          <span data-live className="tabular-nums">{(ov?.active_users_14d ?? 0).toLocaleString()}</span> were here
          in the last 14 days, and together they have earned{" "}
          <span data-live className="tabular-nums">{(ov?.lifetime_xp ?? 0).toLocaleString()}</span> XP.
        </p>
        <p className="text-sm text-ink-500 mt-4 max-w-2xl leading-relaxed">
          That is{" "}
          <span data-live className="tabular-nums font-semibold text-ink-700">{adoptionPct.toFixed(2)}%</span>
          {" of UCSB's undergraduates. "}
          {growthLine ? (
            <span data-live>{growthLine}</span>
          ) : (
            "The last two weeks have not produced XP yet."
          )}
        </p>
      </section>

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
          hint={`${activeShare}% of signups`}
        />
        <StatCard
          label="XP · last 7 days"
          value={xpThis}
          icon={Sparkles}
          trend={hasActivity ? xpDelta : undefined}
          hint={hasActivity ? `${xpPrev.toLocaleString()} the week before` : "No XP in this window"}
        />
        {signupThis !== null && signupDelta ? (
          <StatCard
            label="New · last 7 days"
            value={signupThis}
            icon={TrendingUp}
            trend={signupDelta}
            hint={`${(signupPrev ?? 0).toLocaleString()} the week before`}
          />
        ) : (
          <StatCard
            label="Actions · last 7 days"
            value={actionsThis}
            icon={TrendingUp}
            trend={hasActivity ? actionsDelta : undefined}
            hint={`${actionsPrev.toLocaleString()} the week before`}
          />
        )}
      </section>

      <section className="card p-5 mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">The last 30 days</h2>
            <p className="text-xs text-ink-400 mt-1">
              Pacific calendar days, including days when nobody earned XP.
            </p>
          </div>
          <Legend items={[
            { swatch: "var(--chart-2)", label: "XP" },
            { swatch: "var(--chart-1)", label: "Active Gauchos" },
          ]} />
        </div>
        {hasActivity ? <ActivityArea data={daily} /> : (
          <p className="text-sm text-ink-400">No activity in the last 30 days.</p>
        )}
        {busiest && busiestDate ? (
          <dl className="mt-5 grid sm:grid-cols-3 gap-4 border-t border-cream-200 pt-4">
            <Figure
              label="Busiest day"
              value={busiestDate}
              foot={`${busiest.total_xp.toLocaleString()} XP from ${busiest.active_users} Gauchos — ${
                dailyAvg ? `${(busiest.total_xp / dailyAvg).toFixed(1)}×` : "above"
              } the 30-day average`}
            />
            <Figure
              label="Typical day"
              value={`${dailyAvg.toLocaleString()} XP`}
              foot={`mean of all ${daily.length} days, quiet ones included`}
            />
            <Figure
              label="Best day of the week"
              value={peakDow.label}
              foot={`${peakDow.value.toLocaleString()} XP on an average ${peakDow.label}`}
            />
          </dl>
        ) : null}
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Signup growth</h2>
              <p className="text-xs text-ink-400 mt-1">
                New accounts per day, and the running total of those 30 days.
              </p>
            </div>
            <Legend items={[
              { swatch: "var(--chart-1)", label: "New that day" },
              { swatch: "var(--chart-2)", label: "Running total" },
            ]} />
          </div>
          {signups === null ? (
            <p className="text-sm text-ink-400">
              Signup history is not available from this database yet. XP growth above still is.
            </p>
          ) : signupTotal === 0 ? (
            <p className="text-sm text-ink-400">No new signups in the last 30 days.</p>
          ) : (
            <SignupTrend data={signupPoints} />
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">This week against last week</h2>
          <p className="text-xs text-ink-400 mb-5">
            Two Pacific weeks, ending today. Active Gauchos is the average of each day&apos;s distinct earners, not a sum.
          </p>
          <div className="space-y-5">
            <Compare label="XP earned" current={xpThis} previous={xpPrev} change={xpDelta} />
            <Compare label="Actions" current={actionsThis} previous={actionsPrev} change={actionsDelta} />
            <Compare label="Avg daily actives" current={activeThis} previous={activePrev} change={activeDelta} />
            {signupThis !== null && signupPrev !== null && signupDelta && (
              <Compare label="New Gauchos" current={signupThis} previous={signupPrev} change={signupDelta} />
            )}
          </div>
        </div>
      </section>

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
                  centerValue={classDonut.reduce((n, d) => n + d.value, 0)}
                />
                <DonutLegend data={classDonut} />
              </>}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">What each action is worth</h2>
            <span className="text-xs text-ink-400">XP per action</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            Average XP actually awarded, not the catalog price. Sources are ordered by that average.
          </p>
          {rateBars.length === 0
            ? <p className="text-sm text-ink-400">No actions logged yet.</p>
            : <BarRow items={rateBars} unit=" XP" />}
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">When Gauchos show up</h2>
            <span className="text-xs text-ink-400">avg XP / weekday</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            Average XP by weekday across the last 30 days. Peak{" "}
            <span className="font-semibold text-ink-700">{peakDow.label}</span>.
          </p>
          {hasActivity ? <BarRow items={dowBars} unit=" XP" /> : (
            <p className="text-sm text-ink-400">No activity yet.</p>
          )}
        </div>
      </section>

      <section className="card p-5 mt-4">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-ink-900">Top majors</h2>
          <span className="text-xs text-ink-400">{totalProfiles.toLocaleString()} profiles</span>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          UCSB major codes, shortened. Undeclared is included in the {totalProfiles.toLocaleString()} profiles.
        </p>
        {majorBars.length === 0
          ? <p className="text-sm text-ink-400">No profiles yet.</p>
          : <BarRow items={majorBars} />}
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Badge earnings by rarity</h2>
          <p className="text-xs text-ink-400 mb-4">
            How many times each tier has been earned. The second number is how many badges of that tier exist in the catalog.
          </p>
          <ul data-live className="space-y-3">
            {s.badgeRarity.map((r) => (
              <li key={r.rarity}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="font-semibold capitalize text-ink-900">{r.rarity}</span>
                  <span className="text-xs text-ink-500 tabular-nums">
                    {r.earned.toLocaleString()} earned <span className="text-ink-400">· {r.available} in catalog</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.earned <= 0 ? 0 : Math.max(1.5, (r.earned / maxEarned) * 100)}%`,
                      background: r.rarity === "legendary"
                        ? "var(--color-gold-500)"
                        : r.rarity === "epic"
                        ? "var(--color-gold-600)"
                        : "var(--color-gold-700)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-1">Most-earned badges</h2>
          <p className="text-xs text-ink-400 mb-4">What Gauchos are actually unlocking.</p>
          <ul data-live className="space-y-2">
            {s.topBadges.filter((b) => b.earned_count > 0).slice(0, 6).map((b) => (
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
            {s.topBadges.every((b) => !b.earned_count) && (
              <li className="text-sm text-ink-400">No badges earned yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-ink-900">Streak distribution</h2>
            <span className="text-xs text-ink-400">all profiles</span>
          </div>
          <p className="text-xs text-ink-400 mb-4">
            Current streaks across the {streakDistTotal.toLocaleString()} profiles that have a gamification record.
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
                    {["🥇", "🥈", "🥉"][i] ?? <span className="text-sm font-bold text-ink-400 tabular-nums">{i + 1}</span>}
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

      <section className="card p-5 mt-4">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-ink-900">Trending classes</h2>
          <span className="text-xs text-ink-400">vibes logged</span>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          Courses with the most class-vibe ratings. The mood is the average of those ratings.
        </p>
        {trending.length === 0 ? (
          <p className="text-sm text-ink-400">No vibes logged yet.</p>
        ) : (
          <ul data-live className="grid sm:grid-cols-2 gap-2">
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
                  {t.vibes.toLocaleString()} {t.vibes === 1 ? "vibe" : "vibes"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatCard label="Friendships" value={ov?.friendships ?? 0} icon={Heart} hint="connections formed" />
        <StatCard label="Class vibes" value={ov?.class_vibes ?? 0} icon={MessageSquare} hint="ratings logged" />
        <StatCard label="Badges earned" value={ov?.badges_earned ?? 0} icon={Award} hint="lifetime" />
        <StatCard label="Top streak" value={`${ov?.top_streak ?? 0}d`} icon={Flame} hint="current record" />
      </section>

      {funFacts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 mb-1">
            Stats that made us laugh{" "}
            <span className="italic-accent text-lg">— all of them true.</span>
          </h2>
          <p className="text-sm text-ink-500 mb-3 max-w-2xl leading-relaxed">
            Same database as everything above. A fact drops off the moment the numbers stop supporting it.
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

      <p className="text-xs text-ink-400 mt-10 text-center max-w-xl mx-auto leading-relaxed">
        Aggregates only. The views recompute on every query; this page is cached for 30 seconds.
        Days are America/Los_Angeles. Individual activity stays inside the person&apos;s own session.
      </p>
    </div>
  );
}

function growthTitle(d: Delta) {
  if (d.pct === null) return "This week has XP and last week did not";
  if (d.tone === "flat") return "XP this week matches last week";
  const word = d.tone === "up" ? "up" : "down";
  return `XP is ${word} ${Math.abs(d.pct ?? 0)}% from last week`;
}

function growthSentence(current: number, previous: number, d: Delta) {
  if (current === 0 && previous === 0) return null;
  if (d.pct === null) {
    return `The last 7 days produced ${current.toLocaleString()} XP. The 7 days before that produced none.`;
  }
  if (d.tone === "flat") {
    return `The last 7 days produced ${current.toLocaleString()} XP, the same as the week before.`;
  }
  const word = d.tone === "up" ? "more" : "less";
  return `The last 7 days produced ${current.toLocaleString()} XP, ${Math.abs(d.pct ?? 0)}% ${word} than the ${previous.toLocaleString()} XP earned the week before.`;
}

function Legend({ items }: { items: Array<{ swatch: string; label: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: it.swatch }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function Compare({
  label, current, previous, change,
}: {
  label: string;
  current: number;
  previous: number;
  change: Delta;
}) {
  const max = Math.max(current, previous, 1);
  const tone = change.tone === "up"
    ? "text-success-ink"
    : change.tone === "down"
      ? "text-danger-ink"
      : "text-ink-500";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p data-live className={`text-xs font-semibold tabular-nums ${tone}`}>{change.text}</p>
      </div>
      <Meter caption="This week" value={current} width={(current / max) * 100} tone="primary" />
      <Meter caption="Prior week" value={previous} width={(previous / max) * 100} tone="muted" />
    </div>
  );
}

function Meter({
  caption, value, width, tone,
}: {
  caption: string;
  value: number;
  width: number;
  tone: "primary" | "muted";
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 mt-1">
      <span className="text-[11px] text-ink-400">{caption}</span>
      <span className="h-1.5 rounded-full bg-cream-100 border border-cream-200 overflow-hidden">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value <= 0 ? 0 : Math.max(1.5, width)}%`,
            background: tone === "primary" ? "var(--chart-2)" : "var(--chart-other)",
          }}
        />
      </span>
      <span data-live className="text-xs tabular-nums text-ink-500 w-14 text-right">{value.toLocaleString()}</span>
    </div>
  );
}

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
