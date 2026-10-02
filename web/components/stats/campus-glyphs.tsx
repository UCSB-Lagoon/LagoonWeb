import { clockLabel, splitMajor, WEEKDAY_NAME, type CampusStats, type Weekday } from "@/lib/campus-stats";

// Server-rendered pieces of /stats: glyphs for the fact tiles and the ranked
// lists. No hover state, so no client JS. Each one says its number in text;
// the drawing is the decoration, never the only carrier.

/** 100 squares, `pct` of them filled: "39% of students" you can count. */
export function Waffle({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="stx-waffle" role="img" aria-label={`${pct} out of 100 ${label}`}>
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className={i < pct ? "on" : undefined} style={{ animationDelay: `${i * 6}ms` }} />
      ))}
    </div>
  );
}

/** An analog clock face set to a campus time. */
export function ClockFace({ minute }: { minute: number }) {
  const h = (minute / 60) % 12, m = minute % 60;
  const hourDeg = h * 30 + m * 0.5, minDeg = m * 6;
  return (
    <svg viewBox="0 0 100 100" className="stx-clock" role="img" aria-label={clockLabel(minute)}>
      <circle cx="50" cy="50" r="46" className="stx-clock-face" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="50" y1="9" x2="50" y2={i % 3 === 0 ? 17 : 13} className="stx-clock-tick"
              transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line x1="50" y1="50" x2="50" y2="27" className="stx-clock-hour" transform={`rotate(${hourDeg} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="17" className="stx-clock-min" transform={`rotate(${minDeg} 50 50)`} />
      <circle cx="50" cy="50" r="4" className="stx-clock-pin" />
    </svg>
  );
}

/** Mon–Fri, how much class happens each day (student-hours). */
export function DayBars({ clock, busiest }: { clock: CampusStats["class_clock"]; busiest: Weekday | null }) {
  const days: Weekday[] = ["M", "T", "W", "R", "F"];
  const load = days.map((d) => clock.filter((c) => c.day === d).reduce((s, c) => s + c.n, 0) / 4);
  const max = Math.max(1, ...load);
  return (
    <div className="stx-daybars" role="img"
         aria-label={days.map((d, i) => `${WEEKDAY_NAME[d]} ${Math.round(load[i])} student-hours`).join(", ")}>
      {days.map((d, i) => (
        <div key={d} className={d === busiest ? "is-peak" : undefined}>
          <span style={{ height: `${Math.max(6, (load[i] / max) * 100)}%` }} />
          <i>{WEEKDAY_NAME[d].slice(0, 1)}</i>
        </div>
      ))}
    </div>
  );
}

/** Hero sparkline of the cumulative climb. Painted navy band, so gold ink. */
export function Sparkline({ growth }: { growth: CampusStats["growth"] }) {
  const n = growth.length;
  if (n < 2) return null;
  const W = 520, H = 200, max = growth[n - 1].total || 1;
  const pts = growth.map((g, i) => [(i / (n - 1)) * W, H - 8 - (g.total / max) * (H - 24)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const [ex, ey] = pts[n - 1];
  return (
    <svg viewBox={`0 -10 ${W} ${H + 10}`} preserveAspectRatio="xMidYMax meet" className="stx-spark" aria-hidden="true">
      <defs>
        <linearGradient id="stx-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-on-dark)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-gold-on-dark)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${W},${H}L0,${H}Z`} fill="url(#stx-spark-fill)" />
      <path d={line} pathLength={1} className="stx-spark-line stx-draw" />
      <circle cx={ex} cy={ey} r="6" className="stx-spark-dot" />
    </svg>
  );
}

/** Ranked courses, one dot per student. */
export function CourseDots({ courses }: { courses: CampusStats["top_courses"] }) {
  return (
    <ol className="stx-courses">
      {courses.map((c, i) => (
        <li key={c.course}>
          <span className="stx-rank">{i + 1}</span>
          <span className="stx-course">
            <b>{c.course}</b>
            {c.title && <span>{titleCase(c.title)}</span>}
          </span>
          <span className="stx-dots" aria-hidden="true">
            {Array.from({ length: c.students }, (_, k) => <i key={k} style={{ animationDelay: `${k * 25}ms` }} />)}
          </span>
          <span className="stx-count">{c.students}</span>
        </li>
      ))}
    </ol>
  );
}

/** Majors as labelled bars, full names from the requirement catalog. */
export function MajorBars({ majors }: { majors: CampusStats["majors"] }) {
  const max = Math.max(1, ...majors.map((m) => m.students));
  return (
    <ul className="stx-hbars">
      {majors.map((m) => {
        const { name, degree } = splitMajor(m.name, m.major);
        return (
          <li key={m.major}>
            <span className="stx-hbar-label">{name}{degree && <em> {degree}</em>}</span>
            <span className="stx-hbar-track"><span style={{ width: `${(m.students / max) * 100}%` }} /></span>
            <b>{m.students}</b>
          </li>
        );
      })}
    </ul>
  );
}

/** One 100% bar split by class year; ordinal, so one hue getting deeper. */
export function YearBar({ years }: { years: CampusStats["years"] }) {
  const total = years.reduce((s, y) => s + y.students, 0) || 1;
  return (
    <div>
      <div className="stx-yearbar" role="img"
           aria-label={years.map((y) => `${y.year} ${Math.round((y.students / total) * 100)}%`).join(", ")}>
        {years.map((y, i) => (
          <span key={y.year} style={{
            flexGrow: y.students,
            background: `color-mix(in oklab, var(--chart-1) ${Math.round(45 + (i / Math.max(1, years.length - 1)) * 55)}%, var(--stx-surface))`,
          }} />
        ))}
      </div>
      <ul className="stx-yearlegend">
        {years.map((y, i) => (
          <li key={y.year}>
            <i style={{ background: `color-mix(in oklab, var(--chart-1) ${Math.round(45 + (i / Math.max(1, years.length - 1)) * 55)}%, var(--stx-surface))` }} />
            <span>{y.year}</span>
            <b>{Math.round((y.students / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** GOLD titles are SHOUTED and abbreviated ("LIN ALG W/APPS"). Soften the case, keep the words. */
function titleCase(s: string) {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bW\//g, "w/");
}
