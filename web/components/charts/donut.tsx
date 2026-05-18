"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = ["#f08a3c", "#febc11", "#ffa86d", "#ff7a59", "#e07530", "#b95b22", "#f5e2b8"];

export function Donut({
  data,
  centerLabel,
  centerValue,
}: {
  data: Array<{ name: string; value: number }>;
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            stroke="#fffaf3"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fffaf3", border: "1px solid #f5e8d3",
              borderRadius: 12, fontSize: 12, color: "#18120b",
            }}
            formatter={(v: number, n) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n as string]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-3xl font-display font-bold tabular-nums text-ink-900">{centerValue}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-400 mt-0.5">{centerLabel}</div>
        </div>
      </div>
    </div>
  );
}

export function DonutLegend({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center gap-2 text-ink-700">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
          <span className="truncate">{d.name}</span>
          <span className="ml-auto tabular-nums text-ink-400">
            {total ? Math.round((d.value / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}
