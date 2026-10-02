"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// Interactive pieces of /admin/analytics. Data comes from
// `admin_analytics_dashboard()` (iOS repo, Supabase migration 084) via the
// server page; nothing here fetches.

export type DailyPoint = { day: string; active: number; sessions: number; signups: number };
export type HeatCell = { dow: number; hour: number; users: number };
export type RetentionRow = { week: string; size: number; weeks: (number | null)[] };
export type UserRow = {
  id: string; name: string; major: string | null; year: string | null; signed_up: string;
  last_seen: string; days_active_30d: number; sessions_7d: number; events_7d: number;
  classes: number; app_version: string | null; device: string | null;
  top_feature: string | null; usual_hour: number | null;
};

const shortDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const hourLabel = (h: number | null | undefined) =>
  h === null || h === undefined ? "—" : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;

// ── Single-series time chart ───────────────────────────────────────────────
// One measure per chart: active people and signups are different scales, so
// they get two charts, never one chart with two axes.
export function DailySeries({ data, field, label }: {
  data: DailyPoint[]; field: "active" | "signups" | "sessions"; label: string;
}) {
  const Chart = field === "signups" ? BarChart : LineChart;
  return (
    <div className="h-[200px]" role="img" aria-label={`${label} per day`}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} stroke="var(--color-ink-400)"
                 tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} stroke="var(--color-ink-400)" tick={{ fontSize: 11 }}
                 tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: "var(--color-ink-300)", strokeWidth: 1 }}
            contentStyle={{ background: "var(--color-cream-50)", border: "1px solid var(--chart-grid)", borderRadius: 10, fontSize: 12 }}
            labelFormatter={(d) => shortDay(String(d))}
            formatter={(v) => [v as number, label]}
          />
          {field === "signups" ? (
            <Bar dataKey={field} fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={14} />
          ) : (
            <Line dataKey={field} stroke="var(--chart-1)" strokeWidth={2} dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-cream-50)" }} />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Weekday × hour heatmap ─────────────────────────────────────────────────
// Sequential: one hue (Pacific), more people = more ink. Each cell names its
// value on hover, and the busiest hours are listed under it in text.
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function UsageHeatmap({ cells }: { cells: HeatCell[] }) {
  const [hover, setHover] = useState<HeatCell | null>(null);
  const max = Math.max(1, ...cells.map((c) => c.users));
  const at = (d: number, h: number) => cells.find((c) => c.dow === d && c.hour === h)?.users ?? 0;
  const top = [...cells].sort((a, b) => b.users - a.users).slice(0, 3);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[620px]" style={{ gridTemplateColumns: "40px repeat(24, minmax(0, 1fr))", gap: 2 }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[10px] text-ink-400 text-center tabular-nums">{h % 3 === 0 ? hourLabel(h) : ""}</div>
          ))}
          {DOW.map((name, d) => (
            <div key={name} className="contents">
              <div className="text-[11px] text-ink-500 pr-2 self-center">{name}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const users = at(d, h);
                const pct = users === 0 ? 0 : 15 + Math.round((users / max) * 85);
                return (
                  <div
                    key={h}
                    onMouseEnter={() => setHover({ dow: d, hour: h, users })}
                    onMouseLeave={() => setHover(null)}
                    title={`${name} ${hourLabel(h)} · ${users} people`}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background: users === 0
                        ? "var(--chart-grid)"
                        : `color-mix(in oklab, var(--chart-1) ${pct}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500 min-h-4">
        {hover
          ? <>{DOW[hover.dow]} {hourLabel(hover.hour)}: <span className="font-semibold text-ink-900 tabular-nums">{hover.users}</span> people (sum over 4 weeks)</>
          : <>Busiest: {top.map((c) => `${DOW[c.dow]} ${hourLabel(c.hour)} (${c.users})`).join(" · ") || "—"}</>}
      </p>
    </div>
  );
}

// ── Cohort retention grid ──────────────────────────────────────────────────
export function RetentionGrid({ rows }: { rows: RetentionRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-ink-400">
            <th className="text-left font-medium py-1.5 pr-3">Signed up week of</th>
            <th className="text-right font-medium pr-3">People</th>
            {Array.from({ length: 8 }, (_, n) => (
              <th key={n} className="font-medium px-0.5 text-center">{n === 0 ? "Wk 0" : `Wk ${n}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.week}>
              <td className="py-1 pr-3 text-ink-700 whitespace-nowrap">{shortDay(r.week)}</td>
              <td className="pr-3 text-right text-ink-500">{r.size}</td>
              {r.weeks.map((v, n) => (
                <td key={n} className="px-0.5 py-0.5">
                  <div
                    className="rounded-[4px] h-7 grid place-items-center"
                    title={v === null ? "Not reached yet" : `${v}% of ${r.size} came back in week ${n}`}
                    style={{
                      background: v === null ? "transparent"
                        : `color-mix(in oklab, var(--chart-1) ${Math.max(8, v)}%, transparent)`,
                      border: v === null ? "1px dashed var(--chart-grid)" : "none",
                    }}
                  >
                    <span className={v !== null && v >= 55 ? "text-ink-light font-semibold" : "text-ink-900"}>
                      {v === null ? "" : `${v}%`}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── People table ───────────────────────────────────────────────────────────
type SortKey = "last_seen" | "days_active_30d" | "sessions_7d" | "classes" | "signed_up";

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export function PeopleTable({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("last_seen");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? users.filter((u) => [u.name, u.major, u.year, u.top_feature, u.app_version]
          .some((f) => (f ?? "").toLowerCase().includes(needle)))
      : users;
    return [...filtered].sort((a, b) => {
      const av = a[sort], bv = b[sort];
      if (typeof av === "number" && typeof bv === "number") return bv - av;
      return String(bv).localeCompare(String(av));
    });
  }, [users, q, sort]);

  const header = (key: SortKey, label: string) => (
    <th className="text-right font-medium px-2">
      <button onClick={() => setSort(key)}
              className={`hover:text-ink-900 ${sort === key ? "text-ink-900 underline underline-offset-4" : ""}`}>
        {label}
      </button>
    </th>
  );

  return (
    <div>
      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name, major, feature, version…"
        className="w-full sm:w-80 mb-3 rounded-lg border border-[var(--chart-grid)] bg-transparent px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400"
      />
      <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="sticky top-0 bg-cream-50 text-xs text-ink-400">
            <tr>
              <th className="text-left font-medium py-2 pr-2">Person</th>
              {header("last_seen", "Last seen")}
              {header("days_active_30d", "Days · 30d")}
              {header("sessions_7d", "Opens · 7d")}
              {header("classes", "Classes")}
              <th className="text-left font-medium px-2">Uses most</th>
              <th className="text-right font-medium px-2">Usual time</th>
              {header("signed_up", "Joined")}
              <th className="text-left font-medium pl-2">Build</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-[var(--chart-grid)]">
                <td className="py-2 pr-2">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-xs text-ink-400">{[u.year, u.major].filter(Boolean).join(" · ") || "—"}</div>
                </td>
                <td className="px-2 text-right text-ink-700 whitespace-nowrap">{ago(u.last_seen)}</td>
                <td className="px-2 text-right text-ink-700">{u.days_active_30d}</td>
                <td className="px-2 text-right text-ink-700">{u.sessions_7d}</td>
                <td className="px-2 text-right text-ink-700">{u.classes}</td>
                <td className="px-2 text-ink-700 whitespace-nowrap">{u.top_feature ?? "—"}</td>
                <td className="px-2 text-right text-ink-700">{hourLabel(u.usual_hour)}</td>
                <td className="px-2 text-right text-ink-500 whitespace-nowrap">{shortDay(u.signed_up.slice(0, 10))}</td>
                <td className="pl-2 text-xs text-ink-400 whitespace-nowrap">{u.app_version ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-400">{rows.length} of {users.length} people active in this window.</p>
    </div>
  );
}
