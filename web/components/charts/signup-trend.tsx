"use client";

import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatIsoDate } from "@/lib/stats-helpers";

export type SignupPoint = { day: string; signups: number; cumulative: number };

/**
 * Daily signups (bars) and the running total across the same window (line).
 * The running total is this window only — it is not lifetime signups.
 */
export function SignupTrend({ data }: { data: SignupPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatIsoDate(d.day, { month: "short", day: "numeric" }),
  }));
  return (
    <div data-live className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formatted} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false}
                 tick={{ fill: "var(--color-ink-400)", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis yAxisId="day" tickLine={false} axisLine={false} width={32} allowDecimals={false}
                 tick={{ fill: "var(--color-ink-400)", fontSize: 11 }} />
          <YAxis yAxisId="run" orientation="right" tickLine={false} axisLine={false} width={36}
                 allowDecimals={false}
                 tick={{ fill: "var(--color-ink-400)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "var(--color-panel-elevated)", border: "1px solid var(--chart-grid)",
              borderRadius: 12, fontSize: 12, color: "var(--color-ink-900)",
            }}
            labelStyle={{ color: "var(--color-ink-500)", fontWeight: 600 }}
            formatter={(v, n) => {
              const value = typeof v === "number" ? v : Number(v ?? 0);
              const label = n === "signups" ? "New that day" : "Running total";
              return [value.toLocaleString(), label];
            }}
          />
          <Bar yAxisId="day" dataKey="signups" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Line yAxisId="run" type="monotone" dataKey="cumulative" stroke="var(--chart-2)"
                strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
