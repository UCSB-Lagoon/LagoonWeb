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
                <stop offset="0%"   stopColor="#febc11" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#febc11" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false}
                   tick={{ fill: "#f5e2b899", fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#0c1528", border: "1px solid #febc1144",
                borderRadius: 8, fontSize: 12,
              }}
              labelStyle={{ color: "#f5e2b8" }}
            />
            <Area type="monotone" dataKey="xp" stroke="#febc11" strokeWidth={2}
                  fill="url(#lagoonGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
