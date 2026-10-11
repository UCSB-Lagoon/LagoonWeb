import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CampusNav } from "@/components/campus-heading";
import { getCampusStats } from "@/lib/queries";
import { clockLabel, daysBetween, shortDay, WEEKDAY_NAME, type CampusStats } from "@/lib/campus-stats";
import { UCSB_UNDERGRAD_ENROLLMENT } from "@/lib/stats-helpers";
import { BuildingMap, ClassClock, DailyPulse, GrowthClimb, Heartbeat } from "@/components/stats/campus-charts";
import { ClockFace, CourseDots, DayBars, MajorBars, Sparkline, Waffle, YearBar } from "@/components/stats/campus-glyphs";
import "./stats.css";

// Everything on this page comes from one call, public_campus_stats() (iOS
// repo, Supabase migration 085). It replaced the XP-based views: XP is still
// awarded for a handful of actions, so an "XP earned" chart tracked how often
// people added classes, not how much they used Lagoon.

export const revalidate = 30;
export const metadata: Metadata = {
  title: "Campus by the numbers",
  description:
    "Live, anonymized numbers from Gauchos on Lagoon: when UCSB is in class, which classes everyone's taking, and how the community is growing.",
  alternates: { canonical: "https://www.lagoonucsb.com/stats" },
  openGraph: {
    type: "website",
    title: "Campus by the numbers — Lagoon",
    description: "When UCSB is in class, which classes everyone's taking, and how fast the community is growing. Live and anonymized.",
    url: "https://www.lagoonucsb.com/stats",
    images: [{ url: "https://www.lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus by the numbers — Lagoon",
    description: "When UCSB is in class, which classes everyone's taking, and how fast the community is growing. Live and anonymized.",
    images: [{ url: "https://www.lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" }],
  },
};

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function StatsPage() {
  const s = await getCampusStats();
  if (!s) {
    return (
      <div className="campus-page stx">
        <CampusNav current="/stats" />
        <div className="stx-card">
          <h1 className="stx-h2">Numbers are taking a breather.</h1>
          <p className="stx-lede">Check back in a minute for the latest campus activity.</p>
        </div>
      </div>
    );
  }

  const t = s.totals;
  const f = s.facts;
  const oneIn = t.gauchos ? Math.round(UCSB_UNDERGRAD_ENROLLMENT / t.gauchos) : null;

  return (
    <div className="campus-page stx">
      <Hero stats={s} oneIn={oneIn} />
      <CampusNav current="/stats" />

      <section className="stx-kpis" aria-label="Community totals">
        {f && (
          <div className="stx-kpi stx-kpi-gold">
            <b>{f.share_a_class_pct}%</b>
            <span>already share a class with someone else on Lagoon</span>
          </div>
        )}
        <div className="stx-kpi">
          <b>{t.with_schedule}</b>
          <span>students have added their schedule</span>
        </div>
        <div className="stx-kpi">
          <b>{t.class_seats}</b>
          <span>class seats mapped, across {t.courses} courses</span>
        </div>
        <div className="stx-kpi">
          <b>{t.friendships}</b>
          <span>friendships — accepted, not just requested</span>
        </div>
      </section>

      <Section n="01" kicker="The climb" title={climbHeadline(s.growth)}
               lede="Every Gaucho who has ever signed up, day by day. The strip underneath is new sign-ups each day.">
        <div className="stx-card"><GrowthClimb growth={s.growth} /></div>
      </Section>

      <div className="stx-split">
        <Section n="02" kicker="The daily pulse" title={`${t.active_today} people have opened Lagoon today.`}
                 lede={pulseLede(s)}>
          <div className="stx-card stx-card-fill">
            <DailyPulse days={s.daily_active} />
            <PulseStats days={s.daily_active} />
          </div>
        </Section>
        <Section n="03" kicker="When campus checks in" title={heartbeatHeadline(s.heartbeat)}
                 lede="Each ring is a weekday, Monday inside to Sunday outside; each slice is an hour. Darker means more people. Hover to read any hour.">
          <div className="stx-card stx-card-center"><Heartbeat cells={s.heartbeat} /></div>
        </Section>
      </div>

      {s.class_clock.length > 0 && (
        <Section n="04" kicker="The class clock" title={clockHeadline(s.class_clock)}
                 lede={`How many of the ${t.with_schedule} students with a schedule are sitting in class at every moment of the week. ${f ? WEEKDAY_NAME[f.busiest_day] : "The busiest day"} is in gold.`}>
          <div className="stx-card"><ClassClock clock={s.class_clock} busiest={f?.busiest_day ?? null} /></div>
        </Section>
      )}

      {f && (
        <Section n="05" kicker="Schedules, decoded" title="What a Gaucho week looks like.">
          <div className="stx-bento">
            <Fact big={`${f.friday_free_pct}%`} label="have no class on Friday. Three-day weekend energy.">
              <Waffle pct={f.friday_free_pct} label="students with Fridays free" />
            </Fact>
            <Fact big={`${f.has_8am_pct}%`} label="are in the 8 AM club — a class that starts before 9.">
              <Waffle pct={f.has_8am_pct} label="students with an 8 AM" />
            </Fact>
            <Fact big={`${f.has_evening_pct}%`} label="have class running past 6 PM at least once a week.">
              <Waffle pct={f.has_evening_pct} label="students with evening class" />
            </Fact>
            <Fact big={clockLabel(f.top_start_minute)} label="is the most common start time on campus.">
              <ClockFace minute={f.top_start_minute} />
            </Fact>
            <Fact big={WEEKDAY_NAME[f.busiest_day]} label="is the busiest day. Hump day is real.">
              <DayBars clock={s.class_clock} busiest={f.busiest_day} />
            </Fact>
            <Fact big={`${f.avg_hours_in_class} hrs`} label={`a week in lecture and section, across ${f.avg_courses} classes on average.`}>
              <div className="stx-hours" aria-hidden="true">
                {Array.from({ length: Math.ceil(f.avg_hours_in_class) }, (_, i) => (
                  <span key={i}><i style={{ width: `${Math.min(1, f.avg_hours_in_class - i) * 100}%` }} /></span>
                ))}
              </div>
            </Fact>
          </div>
        </Section>
      )}

      <div className="stx-split">
        {s.top_courses.length > 0 && (
          <Section n="06" kicker="Most-shared classes"
                   title={`${s.top_courses[0].course} is the biggest Lagoon class.`}
                   lede="One dot per student on Lagoon. If you're in one of these, your classmates are already here.">
            <div className="stx-card"><CourseDots courses={s.top_courses} /></div>
          </Section>
        )}
        {s.top_buildings.length > 0 && (
          <Section n="07" kicker="Where class happens" title={`${s.top_buildings[0].building} wins.`}
                   lede="Bubble size is how many Lagoon students have class in each building.">
            <div className="stx-card"><BuildingMap buildings={s.top_buildings} /></div>
          </Section>
        )}
      </div>

      {(s.majors.length > 0 || s.years.length > 0) && (
        <Section n="08" kicker="Who's here" title="Every corner of campus, so far.">
          <div className="stx-split stx-split-tight">
            {s.majors.length > 0 && (
              <div className="stx-card">
                <h3 className="stx-h3">Top majors</h3>
                <MajorBars majors={s.majors.slice(0, 10)} />
              </div>
            )}
            {s.years.length > 0 && (
              <div className="stx-card">
                <h3 className="stx-h3">By year</h3>
                <YearBar years={s.years} />
                <p className="stx-small">
                  {yearsNote(s.years)}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      <section className="stx-cta">
        <span className="stx-cta-k">FIND YOUR PEOPLE</span>
        <h2>{f ? `${f.share_a_class_pct}% already found a classmate here.` : "Your classmates are already here."}</h2>
        <p>Add your schedule and see who&apos;s in your classes, compare weeks with friends, and never eat at a closed dining hall again.</p>
        <a href={APP_STORE} className="stx-cta-btn" data-lagoon-cta="stats">Get Lagoon — free ↗</a>
      </section>

      <p className="campus-methodology">
        Lagoon users only, not university-wide figures. Internal test accounts are excluded, and a course,
        building or major appears only once three or more students share it; schedule facts appear only
        once twenty or more students have a schedule. &ldquo;Today&rdquo; and every time of day are Pacific time.
        A visit is one person opening Lagoon in a given hour on a given day. Updated every 30 seconds
        (last at {new Date(s.generated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })}).
      </p>
    </div>
  );
}

// ── pieces ────────────────────────────────────────────────────────────────

function Hero({ stats, oneIn }: { stats: CampusStats; oneIn: number | null }) {
  const t = stats.totals;
  return (
    <header className="stx-hero">
      <div className="stx-hero-copy">
        <p className="stx-live"><span className="stx-live-dot" aria-hidden="true" /> LIVE · LAGOON / BY THE NUMBERS</p>
        <h1>
          <span className="stx-mega">{t.gauchos.toLocaleString()}</span>
          <span className="stx-mega-label">Gauchos on Lagoon</span>
        </h1>
        <ul className="stx-hero-row">
          <li><b>{t.active_today}</b> here today</li>
          <li><b>{t.active_7d}</b> this week</li>
          <li><b>{t.active_30d}</b> this month</li>
        </ul>
        {oneIn && (
          <p className="stx-hero-note">
            About one in every {oneIn} UCSB undergrads (Fall &rsquo;25 census). Real counts — nothing rounded up, nothing seeded.
          </p>
        )}
      </div>
      <div className="stx-hero-art">
        <Sparkline growth={stats.growth} />
        {stats.growth.length > 0 && (
          <span className="stx-hero-since">since {shortDay(stats.growth[0].day, { month: "long", year: "numeric" })}</span>
        )}
      </div>
    </header>
  );
}

function Section({ n, kicker, title, lede, children }: {
  n: string; kicker: string; title: string; lede?: string; children: ReactNode;
}) {
  return (
    <section className="stx-section">
      <p className="stx-kicker"><span>{n}</span>{kicker}</p>
      <h2 className="stx-h2">{title}</h2>
      {lede && <p className="stx-lede">{lede}</p>}
      {children}
    </section>
  );
}

function PulseStats({ days }: { days: CampusStats["daily_active"] }) {
  const full = days.slice(0, -1);
  if (!full.length) return null;
  const avg = Math.round(full.reduce((sum, d) => sum + d.active, 0) / full.length);
  const best = full.reduce((b, d) => (d.active > b.active ? d : b), full[0]);
  const wk = (from: number, to: number) => days.slice(from, to).reduce((sum, d) => sum + d.active, 0);
  const n = days.length;
  const thisWeek = wk(n - 8, n - 1), lastWeek = wk(n - 15, n - 8);
  const change = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
  return (
    <dl className="stx-ministats">
      <div><dt>Average day</dt><dd>{avg}</dd></div>
      <div><dt>Best day</dt><dd>{best.active}<small>{shortDay(best.day)}</small></dd></div>
      {change !== null && (
        <div><dt>Last 7 days vs the 7 before</dt><dd>{change > 0 ? "+" : ""}{change}%</dd></div>
      )}
    </dl>
  );
}

function Fact({ big, label, children }: { big: string; label: string; children: ReactNode }) {
  return (
    <div className="stx-fact">
      <div className="stx-fact-art">{children}</div>
      <b>{big}</b>
      <span>{label}</span>
    </div>
  );
}

// ── headlines: each chart leads with the sentence it proves ──────────────

function climbHeadline(growth: CampusStats["growth"]) {
  const first = growth[0];
  const at = (v: number) => growth.find((g) => g.total >= v);
  const h100 = at(100), h200 = at(200);
  if (first && h100 && h200) {
    const a = daysBetween(first.day, h100.day), b = daysBetween(h100.day, h200.day);
    if (b < a) return `The first 100 Gauchos took ${monthsOrDays(a)}. The next 100 took ${monthsOrDays(b)}.`;
  }
  const last = growth[growth.length - 1];
  return last ? `${last.total} Gauchos and counting.` : "The climb starts here.";
}

function monthsOrDays(d: number) {
  if (d >= 60) return `${Math.round(d / 30)} months`;
  if (d >= 14) return `${Math.round(d / 7)} weeks`;
  return `${d} days`;
}

function pulseLede(s: CampusStats) {
  const full = s.daily_active.slice(0, -1);
  const avg = full.length ? full.reduce((sum, d) => sum + d.active, 0) / full.length : 0;
  if (!avg || !s.totals.active_30d) return "People who opened Lagoon each day, last 30 days. Today counts so far.";
  const ratio = Math.max(1, Math.round(s.totals.active_30d / avg));
  return `People who opened Lagoon each day for the last 30 days; today counts so far. On an average day, about 1 in ${ratio} of this month's users opens the app.`;
}

function heartbeatHeadline(cells: CampusStats["heartbeat"]) {
  if (!cells.length) return "When campus checks in.";
  const byDow = Array(7).fill(0) as number[];
  cells.forEach((c) => { byDow[c.dow] += c.n; });
  const top = byDow.indexOf(Math.max(...byDow));
  const quiet = byDow.indexOf(Math.min(...byDow));
  return `${DOW_LONG[top]}s are busiest. ${DOW_LONG[quiet]}s, everyone logs off.`;
}

function clockHeadline(clock: CampusStats["class_clock"]) {
  const peak = clock.reduce((best, c) => (c.n > best.n ? c : best), clock[0]);
  return `${WEEKDAY_NAME[peak.day]} at ${clockLabel(peak.minute)}: peak class o'clock.`;
}

function yearsNote(years: CampusStats["years"]) {
  const total = years.reduce((s, y) => s + y.students, 0);
  const top = [...years].sort((a, b) => b.students - a.students)[0];
  return `${Math.round((top.students / total) * 100)}% of the ${total} students who set a year are ${top.year.toLowerCase()}s.`;
}
