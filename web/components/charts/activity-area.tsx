"use client";

import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";

export type DailyPoint = { day: string; total_xp: number; event_count: number; active_users: number };

export function ActivityArea({ data }: { data: DailyPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="actGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#003660" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#003660" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f5e8d3" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false}
                 tick={{ fill: "#8c7a66", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false}
                 tick={{ fill: "#8c7a66", fontSize: 11 }} width={28} />
          <Tooltip
            contentStyle={{
              background: "#fffaf3", border: "1px solid #f5e8d3",
              borderRadius: 12, fontSize: 12, color: "#18120b",
            }}
            labelStyle={{ color: "#6b5b4a", fontWeight: 600 }}
            formatter={(v: number, n) => {
              const label = n === "total_xp" ? "XP" : n === "event_count" ? "Actions" : "Active users";
              return [v.toLocaleString(), label];
            }}
          />
          <Area type="monotone" dataKey="total_xp" stroke="#003660" strokeWidth={2.5}
                fill="url(#actGrad)" />
          <Area type="monotone" dataKey="event_count" stroke="#febc11" strokeWidth={1.5}
                fill="transparent" strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
