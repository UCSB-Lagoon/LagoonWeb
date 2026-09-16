"use client";

import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type TrendPoint = { day: string; xp: number };

export function XpTrend({ data }: { data: TrendPoint[] }) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-bold text-ink-900 mb-3">XP this week</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="var(--chart-2)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false}
                   tick={{ fill: "var(--color-ink-400)", fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--color-panel-elevated)", border: "1px solid var(--chart-grid)",
                borderRadius: 12, fontSize: 12, color: "var(--color-ink-900)",
              }}
              labelStyle={{ color: "var(--color-ink-500)" }}
            />
            <Area type="monotone" dataKey="xp" stroke="var(--chart-2)" strokeWidth={2.5}
                  fill="url(#xpGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
