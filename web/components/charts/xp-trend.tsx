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
                <stop offset="0%"   stopColor="#f08a3c" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#f08a3c" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false}
                   tick={{ fill: "#8c7a66", fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#fffaf3", border: "1px solid #f5e8d3",
                borderRadius: 12, fontSize: 12, color: "#18120b",
              }}
              labelStyle={{ color: "#6b5b4a" }}
            />
            <Area type="monotone" dataKey="xp" stroke="#f08a3c" strokeWidth={2.5}
                  fill="url(#xpGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
