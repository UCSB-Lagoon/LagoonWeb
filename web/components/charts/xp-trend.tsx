"use client";

import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type TrendPoint = { day: string; xp: number };

export function XpTrend({ data }: { data: TrendPoint[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-lg mb-3">XP this week</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="lagoonGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false}
                   tick={{ fill: "#cffafe88", fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#04212c", border: "1px solid #22d3ee44",
                borderRadius: 8, fontSize: 12,
              }}
              labelStyle={{ color: "#cffafe" }}
            />
            <Area type="monotone" dataKey="xp" stroke="#22d3ee" strokeWidth={2}
                  fill="url(#lagoonGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
