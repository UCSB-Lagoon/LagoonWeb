"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clockLabel,
  niceScale,
  shortDay,
  WEEKDAY_NAME,
  type CampusStats,
  type Weekday,
} from "@/lib/campus-stats";
import { CAMPUS_BUILDINGS } from "@/lib/campus-buildings";

// Interactive charts for /stats. Every one is hand-drawn SVG sized to its
// container's real pixel width (not a scaled viewBox), so axis text stays
// legible on a phone. Data comes from public_campus_stats() via the server
// page; nothing here fetches.
//
// Colour: --chart-1 (Pacific) is the series hue everywhere, magnitude is that
// one hue getting stronger, and --chart-2 (gold) marks the single thing each
// chart wants you to notice — today, the busiest day, the peak.

// ── plumbing ───────────────────────────────────────────────────────────────

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Tooltip anchored at (x, y) inside a relative container; flips at the midline. */
function Tip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const right = x > width / 2;
  return (
    <div
      className="stx-tip"
      style={{
        left: x,
        top: y,
        transform: `translate(${right ? "calc(-100% - 14px)" : "14px"}, -50%)`,
      }}
      role="status"
    >
      {children}
    </div>
  );
}

/** Bar with a 4px rounded data-end, square at the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/** Monotone cubic through points (Fritsch–Carlson): smooth, never overshoots. */
function monotonePath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3;
    d += `C${(x0 + h).toFixed(1)},${(y0 + t[i] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[i + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

// Square-root ramp: a handful of visits still reads as "some", not as empty.
const pctOf = (n: number, max: number) => (n <= 0 ? 0 : 20 + Math.round(Math.sqrt(n / Math.max(1, max)) * 80));
const heat = (n: number, max: number) =>
  n <= 0 ? "var(--chart-grid)" : `color-mix(in oklab, var(--chart-1) ${pctOf(n, max)}%, var(--stx-surface))`;

// ── 01 · The climb ─────────────────────────────────────────────────────────

export function GrowthClimb({ growth }: { growth: CampusStats["growth"] }) {
  const [ref, w] = useWidth<HTMLDivElement>(960);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();
  const n = growth.length;
  if (n < 2) return null;

  const narrow = w < 560;
  const H = narrow ? 300 : 360;
  const m = { l: 6, r: 40, t: 18 };
  const strip = 46;
  const plotH = H - m.t - strip - 26;
  const plotW = w - m.l - m.r;
  const { max, step } = niceScale(growth[n - 1].total, 5);
  const x = (i: number) => m.l + (i / (n - 1)) * plotW;
  const y = (v: number) => m.t + plotH - (v / max) * plotH;
  const base = y(0);
  const line = growth.map((g, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(g.total).toFixed(1)}`).join("");
  const area = `${line}L${x(n - 1)},${base}L${x(0)},${base}Z`;

  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, k) => k * step);
  const milestones = ticks
    .filter((v) => v > 0)
    .map((v) => ({ v, i: growth.findIndex((g) => g.total >= v) }))
    .filter((ms) => ms.i >= 0);
  const months = growth
    .map((g, i) => ({ i, day: g.day }))
    .filter(({ day }, i) => i > 0 && day.endsWith("-01"));

  const newMax = Math.max(1, ...growth.map((g) => g.new));
  const stripTop = base + 10;
  const stripH = strip - 14;
  const band = plotW / n;
  const barW = Math.max(1, band - (band > 4 ? 1.5 : 0.5));
  const peakNew = growth.reduce((best, g, i) => (g.new > growth[best].new ? i : best), 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - m.l) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const h = hover === null ? null : growth[hover];

  return (
    <div ref={ref} className="stx-chart" role="img"
         aria-label={`Gauchos on Lagoon over time, ${growth[0].total} on ${shortDay(growth[0].day)} to ${growth[n - 1].total} today`}>
      <svg width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="stx-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={m.l + plotW} y1={y(v)} y2={y(v)} className="stx-grid" />
            <text x={m.l + plotW + 8} y={y(v) + 4} className="stx-axis">{v}</text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} className="stx-fade" />
        <path d={line} pathLength={1} className="stx-line stx-draw" />

        {milestones.map(({ v, i }) => (
          <g key={v} className="stx-fade">
            <circle cx={x(i)} cy={y(v)} r={5} className="stx-milestone" />
            <text x={x(i) - 10} y={y(v) - 8} textAnchor="end" className="stx-note">
              <tspan className="stx-note-strong">{v}</tspan> · {shortDay(growth[i].day)}
            </text>
          </g>
        ))}

        <circle cx={x(n - 1)} cy={y(growth[n - 1].total)} r={5} className="stx-now" />
        <circle cx={x(n - 1)} cy={y(growth[n - 1].total)} r={5} className="stx-now-ping" />

        {/* New each day: same x, its own scale, labelled as its own measure. */}
        <text x={m.l} y={stripTop + 2} className="stx-kicker-svg">NEW EACH DAY</text>
        {growth.map((g, i) => {
          const bh = (g.new / newMax) * stripH;
          return g.new > 0 ? (
            <rect key={g.day} x={x(i) - barW / 2} y={stripTop + 6 + stripH - bh} width={barW} height={bh} rx={Math.min(1.5, barW / 2)}
                  className={i === peakNew ? "stx-bar-accent" : "stx-bar-soft"} />
          ) : null;
        })}
        <text x={m.l + plotW + 8} y={stripTop + 6 + 4} className="stx-axis">{newMax}</text>

        {months.map(({ i, day }) => (
          <text key={day} x={x(i)} y={H - 6} textAnchor="middle" className="stx-axis">
            {shortDay(day, { month: "short" })}
          </text>
        ))}

        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={stripTop + strip - 8} className="stx-crosshair" />
            <circle cx={x(hover)} cy={y(h.total)} r={5} className="stx-hover-dot" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <Tip x={x(hover)} y={y(h.total)} width={w}>
          <span className="stx-tip-k">{shortDay(h.day, { weekday: "short", month: "short", day: "numeric" })}</span>
          <b>{h.total}</b> Gauchos
          <span className="stx-tip-sub">{h.new ? `+${h.new} that day` : "no new sign-ups"}</span>
        </Tip>
      )}
    </div>
  );
}

// ── 02 · Daily pulse ───────────────────────────────────────────────────────

export function DailyPulse({ days }: { days: CampusStats["daily_active"] }) {
  const [ref, w] = useWidth<HTMLDivElement>(640);
  const [hover, setHover] = useState<number | null>(null);
  const n = days.length;
  if (!n) return null;

  const H = w < 420 ? 220 : 330;
  const m = { l: 2, r: 34, t: 14, b: 26 };
  const plotW = w - m.l - m.r;
  const plotH = H - m.t - m.b;
  const { max, step } = niceScale(Math.max(...days.map((d) => d.active)), 4);
  const band = plotW / n;
  const gap = band > 10 ? 3 : 1.5;
  const y = (v: number) => m.t + plotH - (v / max) * plotH;
  const full = days.slice(0, -1);
  const avg = full.length ? full.reduce((s, d) => s + d.active, 0) / full.length : 0;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, k) => k * step);

  return (
    <div ref={ref} className="stx-chart" role="img" aria-label={`People opening Lagoon each day, last ${n} days`}>
      <svg width={w} height={H} className="stx-svg" onPointerLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={m.l + plotW} y1={y(v)} y2={y(v)} className="stx-grid" />
            <text x={m.l + plotW + 6} y={y(v) + 4} className="stx-axis">{v}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const bx = m.l + i * band + gap / 2;
          const today = i === n - 1;
          return (
            <g key={d.day} onPointerEnter={() => setHover(i)}>
              <rect x={m.l + i * band} y={m.t} width={band} height={plotH} fill="transparent" />
              <path d={barPath(bx, y(d.active), band - gap, plotH + m.t - y(d.active))}
                    className={`stx-grow ${today ? "stx-bar-accent" : "stx-bar"} ${hover !== null && hover !== i ? "stx-dim" : ""}`}
                    style={{ animationDelay: `${i * 14}ms` }} />
            </g>
          );
        })}
        <line x1={m.l} x2={m.l + plotW} y1={y(avg)} y2={y(avg)} className="stx-avg" />
        <text x={m.l + 4} y={y(avg) - 6} className="stx-note">avg {Math.round(avg)} a day</text>
        {days.map((d, i) => (i % 7 === (n - 1) % 7 ? (
          <text key={d.day} x={m.l + i * band + band / 2} y={H - 6} textAnchor="middle" className="stx-axis">
            {i === n - 1 ? "Today" : shortDay(d.day)}
          </text>
        ) : null))}
      </svg>
      {hover !== null && (
        <Tip x={m.l + hover * band + band / 2} y={y(days[hover].active)} width={w}>
          <span className="stx-tip-k">{shortDay(days[hover].day, { weekday: "short", month: "short", day: "numeric" })}</span>
          <b>{days[hover].active}</b> {days[hover].active === 1 ? "person" : "people"}
          {hover === n - 1 && <span className="stx-tip-sub">so far today</span>}
        </Tip>
      )}
    </div>
  );
}

// ── 03 · Heartbeat (24-hour radial) ────────────────────────────────────────

const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const RING_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday innermost, Sunday outside
const RING_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  // Rounded: server and browser trig differ in the last bits, which is a
  // hydration mismatch on every one of the 168 paths.
  const a = (deg * Math.PI) / 180;
  const round = (v: number) => Math.round(v * 100) / 100;
  return [round(cx + r * Math.sin(a)), round(cy - r * Math.cos(a))];
}

function sector(cx: number, cy: number, ri: number, ro: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, ro, a0), [x1, y1] = polar(cx, cy, ro, a1);
  const [x2, y2] = polar(cx, cy, ri, a1), [x3, y3] = polar(cx, cy, ri, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  const r2 = (v: number) => v.toFixed(2);
  return `M${x0},${y0}A${r2(ro)},${r2(ro)} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r2(ri)},${r2(ri)} 0 ${large} 0 ${x3},${y3}Z`;
}

export function Heartbeat({ cells }: { cells: CampusStats["heartbeat"] }) {
  const [ref, w] = useWidth<HTMLDivElement>(460);
  const [hover, setHover] = useState<{ dow: number; hour: number; n: number } | null>(null);
  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    cells.forEach((c) => { g[c.dow][c.hour] = c.n; });
    return g;
  }, [cells]);
  const max = Math.max(1, ...cells.map((c) => c.n));
  const byHour = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + row[h], 0));
  const peakHour = byHour.indexOf(Math.max(...byHour));

  const size = Math.min(w, 480);
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 24;
  const r0 = R * 0.36;
  const ringW = (R - r0) / 7;
  const GAP = 16; // degrees left open at the top for the day letters
  const sweep = (360 - GAP) / 24;
  const hourStart = (h: number) => GAP / 2 + h * sweep;

  const center = hover
    ? { k: `${DOW_LONG[hover.dow]}`, big: clockLabel(hover.hour * 60, true), sub: `${hover.n} ${hover.n === 1 ? "visit" : "visits"}` }
    : { k: "Busiest hour", big: clockLabel(peakHour * 60, true), sub: "all week" };

  return (
    <div ref={ref} className="stx-chart stx-radial" role="img"
         aria-label={`When people open Lagoon, by weekday and hour. Busiest hour overall: ${clockLabel(peakHour * 60)}.`}>
      <svg width={size} height={size} className="stx-svg" onPointerLeave={() => setHover(null)}>
        {RING_ORDER.map((dow, ring) => {
          const ri = r0 + ring * ringW + 1;
          const ro = r0 + (ring + 1) * ringW - 1;
          return (
            <g key={dow}>
              {grid[dow].map((v, hour) => (
                <path key={hour}
                      d={sector(cx, cy, ri, ro, hourStart(hour) + 0.7, hourStart(hour + 1) - 0.7)}
                      fill={heat(v, max)}
                      className={`stx-cell ${hover && (hover.dow !== dow || hover.hour !== hour) ? "stx-dim-soft" : ""}`}
                      onPointerEnter={() => setHover({ dow, hour, n: v })} />
              ))}
              <text x={cx} y={cy - (ri + ro) / 2 + 3.5} textAnchor="middle" className="stx-ring-letter">
                {RING_LETTER[dow]}
              </text>
            </g>
          );
        })}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
          const [tx, ty] = polar(cx, cy, R + 13, hourStart(h));
          return <text key={h} x={tx} y={ty + 4} textAnchor="middle" className="stx-axis">{clockLabel(h * 60, true)}</text>;
        })}
        <text x={cx} y={cy - 16} textAnchor="middle" className="stx-kicker-svg">{center.k.toUpperCase()}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="stx-radial-big">{center.big}</text>
        <text x={cx} y={cy + 32} textAnchor="middle" className="stx-note">{center.sub}</text>
      </svg>
    </div>
  );
}

// ── 04 · Class clock (ridgeline) ───────────────────────────────────────────

const DAYS: Weekday[] = ["M", "T", "W", "R", "F"];
const CLOCK_START = 7 * 60, CLOCK_END = 22 * 60;

export function ClassClock({ clock, busiest }: { clock: CampusStats["class_clock"]; busiest: Weekday | null }) {
  const [ref, w] = useWidth<HTMLDivElement>(960);
  const [hover, setHover] = useState<number | null>(null);
  const fillId = useId();
  const accentId = useId();
  if (!clock.length) return null;

  const narrow = w < 560;
  const rowH = narrow ? 44 : 58;
  const amp = rowH * 1.6;
  const left = narrow ? 34 : 92;
  const m = { t: amp - rowH + 10, r: 12 };
  const H = m.t + rowH * 5 + 30;
  const plotW = w - left - m.r;
  const x = (min: number) => left + ((min - CLOCK_START) / (CLOCK_END - CLOCK_START)) * plotW;
  const max = Math.max(1, ...clock.map((c) => c.n));
  const series = DAYS.map((day) => clock.filter((c) => c.day === day).sort((a, b) => a.minute - b.minute));
  const slots = series[0].map((c) => c.minute);
  const peak = clock.reduce((best, c) => (c.n > best.n ? c : best), clock[0]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const min = CLOCK_START + ((e.clientX - r.left - left) / plotW) * (CLOCK_END - CLOCK_START);
    const snapped = Math.round(min / 15) * 15;
    setHover(Math.max(CLOCK_START, Math.min(CLOCK_END, snapped)));
  };

  return (
    <div ref={ref} className="stx-chart" role="img"
         aria-label={`Students in class at each time of day, Monday to Friday. Peak: ${peak.n} on ${WEEKDAY_NAME[peak.day]} at ${clockLabel(peak.minute)}.`}>
      <svg width={w} height={H} className="stx-svg" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id={accentId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {[8, 10, 12, 14, 16, 18, 20, 22].map((hr) => (
          <g key={hr}>
            <line x1={x(hr * 60)} x2={x(hr * 60)} y1={m.t - amp + rowH} y2={m.t + rowH * 5} className="stx-grid" />
            <text x={x(hr * 60)} y={H - 8} textAnchor="middle" className="stx-axis">{clockLabel(hr * 60, true)}</text>
          </g>
        ))}

        {series.map((s, row) => {
          const day = DAYS[row];
          const baseY = m.t + rowH * (row + 1);
          const pts = s.map((c) => [x(c.minute), baseY - (c.n / max) * amp] as [number, number]);
          const curve = monotonePath(pts);
          const isBusy = day === busiest;
          return (
            <g key={day} className="stx-ridge" style={{ animationDelay: `${row * 90}ms` }}>
              <path d={`${curve}L${x(CLOCK_END)},${baseY}L${x(CLOCK_START)},${baseY}Z`}
                    fill={`url(#${isBusy ? accentId : fillId})`} />
              <path d={curve} className="stx-ridge-ring" />
              <path d={curve} className={isBusy ? "stx-line-accent" : "stx-line"} />
              <line x1={left} x2={left + plotW} y1={baseY} y2={baseY} className="stx-baseline" />
              <text x={0} y={baseY - 4} className={`stx-day ${isBusy ? "stx-day-accent" : ""}`}>
                {narrow ? day : WEEKDAY_NAME[day]}
              </text>
            </g>
          );
        })}

        {(() => {
          const row = DAYS.indexOf(peak.day);
          const px = x(peak.minute), py = m.t + rowH * (row + 1) - (peak.n / max) * amp;
          const flip = px > w * 0.62;
          return (
            <g pointerEvents="none" className="stx-fade">
              <circle cx={px} cy={py} r={4.5} className="stx-milestone" />
              <text x={px + (flip ? -10 : 10)} y={py - 6} textAnchor={flip ? "end" : "start"} className="stx-note">
                <tspan className="stx-note-strong">{peak.n} in class at once</tspan>
              </text>
            </g>
          );
        })()}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={m.t - amp + rowH} y2={m.t + rowH * 5} className="stx-crosshair" />
            {series.map((s, row) => {
              const c = s.find((p) => p.minute === hover);
              if (!c) return null;
              return <circle key={row} cx={x(hover)} cy={m.t + rowH * (row + 1) - (c.n / max) * amp} r={3.5} className="stx-hover-dot" />;
            })}
          </g>
        )}
      </svg>
      {hover !== null && slots.includes(hover) && (
        <Tip x={x(hover)} y={H / 2} width={w}>
          <span className="stx-tip-k">In class at {clockLabel(hover)}</span>
          <span className="stx-tip-rows">
            {series.map((s, row) => (
              <span key={row}><i>{WEEKDAY_NAME[DAYS[row]].slice(0, 3)}</i><b>{s.find((p) => p.minute === hover)?.n ?? 0}</b></span>
            ))}
          </span>
        </Tip>
      )}
    </div>
  );
}

// ── 07 · Where class happens ───────────────────────────────────────────────

export function BuildingMap({ buildings }: { buildings: CampusStats["top_buildings"] }) {
  const [ref, w] = useWidth<HTMLDivElement>(560);
  const [active, setActive] = useState<string | null>(null);
  const mapped = buildings.filter((b) => b.lat !== null && b.lng !== null) as
    (CampusStats["top_buildings"][number] & { lat: number; lng: number })[];
  const max = Math.max(1, ...buildings.map((b) => b.students));
  const rank = new Map(buildings.map((b, i) => [b.building, i + 1]));

  const narrow = w < 520;
  const H = narrow ? 300 : 420;
  const pad = 34;
  const kx = 0.825; // cos(34.414°), a literal so server and browser trig agree
  const inCore = (lat: number, lng: number) => lat > 34.4095 && lat < 34.418 && lng > -119.853 && lng < -119.842;
  // The legend lists ten; a numbered bubble with no legend row is a riddle.
  const plotted = mapped.filter((b) => inCore(b.lat, b.lng) && (rank.get(b.building) ?? 99) <= 10);
  const context = CAMPUS_BUILDINGS.filter((b) => inCore(b.lat, b.lng));
  const all = [...context.map((b) => [b.lng, b.lat]), ...plotted.map((b) => [b.lng, b.lat])];
  const xs = all.map(([lng]) => lng * kx), ys = all.map(([, lat]) => lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((w - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
  const ox = (w - (maxX - minX) * scale) / 2, oy = (H - (maxY - minY) * scale) / 2;
  const px = (lng: number) => ox + (lng * kx - minX) * scale;
  const py = (lat: number) => oy + (maxY - lat) * scale;
  const radius = (s: number) => 9 + Math.sqrt(s / max) * (narrow ? 15 : 24);

  // Girvetz, Buchanan, HSSB and Music sit within a stone's throw of each
  // other, so true positions overlap. Nudge bubbles apart (a few rounds of
  // pairwise pushes) and draw a thin tether back to where each one really is.
  const bubbles = plotted.map((b) => ({ b, x0: px(b.lng), y0: py(b.lat), x: px(b.lng), y: py(b.lat), r: radius(b.students) }));
  for (let round = 0; round < 80; round++) {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i], c = bubbles[j];
        let dx = c.x - a.x, dy = c.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) { dx = 1; dy = 0; d = 1; }
        const overlap = a.r + c.r + 3 - d;
        if (overlap > 0) {
          const ux = dx / d, uy = dy / d, wa = c.r / (a.r + c.r), wc = a.r / (a.r + c.r);
          a.x -= ux * overlap * wa; a.y -= uy * overlap * wa;
          c.x += ux * overlap * wc; c.y += uy * overlap * wc;
        }
      }
    }
    for (const bb of bubbles) {
      bb.x = Math.min(w - bb.r - 4, Math.max(bb.r + 4, bb.x));
      bb.y = Math.min(H - bb.r - 4, Math.max(bb.r + 4, bb.y));
    }
  }
  const pos = new Map(bubbles.map((bb) => [bb.b.building, bb]));

  return (
    <div className="stx-map">
      <div ref={ref} className="stx-chart stx-map-canvas" role="img"
           aria-label="Map of campus buildings, bubble size by how many Lagoon students have class there">
        <svg width={w} height={H} className="stx-svg">
          <text x={w - 12} y={20} textAnchor="end" className="stx-kicker-svg">N ↑</text>
          <text x={12} y={H - 10} className="stx-kicker-svg">← ISLA VISTA</text>
          <text x={w - 12} y={H - 10} textAnchor="end" className="stx-kicker-svg">↓ THE OCEAN</text>
          {context.map((b) => (
            <circle key={b.id} cx={px(b.lng)} cy={py(b.lat)} r={2.5} className="stx-context-dot" />
          ))}
          {bubbles.map((bb) => (
            Math.hypot(bb.x - bb.x0, bb.y - bb.y0) > 2 ? (
              <g key={`t-${bb.b.building}`} pointerEvents="none">
                <line x1={bb.x0} y1={bb.y0} x2={bb.x} y2={bb.y} className="stx-tether" />
                <circle cx={bb.x0} cy={bb.y0} r={2} className="stx-tether-dot" />
              </g>
            ) : null
          ))}
          {[...bubbles].sort((a, c) => c.r - a.r).map((bb) => {
            const on = active === bb.b.building;
            return (
              <g key={bb.b.building} onPointerEnter={() => setActive(bb.b.building)} onPointerLeave={() => setActive(null)}
                 className="stx-bubble-g">
                <circle cx={bb.x} cy={bb.y} r={bb.r} className={on ? "stx-bubble stx-bubble-on" : "stx-bubble"} />
                <text x={bb.x} y={bb.y + 4} textAnchor="middle" className="stx-bubble-n">{rank.get(bb.b.building)}</text>
              </g>
            );
          })}
        </svg>
        {active && (() => {
          const bb = pos.get(active);
          const b = bb?.b;
          return bb && b ? (
            <Tip x={bb.x} y={bb.y} width={w}>
              <span className="stx-tip-k">{b.building}</span>
              <b>{b.students}</b> students
              <span className="stx-tip-sub">{b.meetings} class meetings a week</span>
            </Tip>
          ) : null;
        })()}
      </div>
      <ol className="stx-map-legend">
        {buildings.slice(0, 10).map((b, i) => (
          <li key={b.building}
              className={active === b.building ? "is-on" : ""}
              onPointerEnter={() => setActive(b.building)} onPointerLeave={() => setActive(null)}>
            <span className="stx-rank">{i + 1}</span>
            <span className="stx-map-name">
              {b.building}
              {b.lat === null ? <em> · not on the map yet</em>
                : !pos.has(b.building) && <em> · in Isla Vista</em>}
            </span>
            <span className="stx-map-bar"><span style={{ width: `${(b.students / max) * 100}%` }} /></span>
            <b>{b.students}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
