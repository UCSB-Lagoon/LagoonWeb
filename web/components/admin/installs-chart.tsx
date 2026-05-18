"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export type InstallsPoint = { day: string; count: number };

export function InstallsChart({ data, totalLabel }: { data: InstallsPoint[]; totalLabel?: string }) {
  if (!data.length) {
    return (
      <div className="text-center py-12 text-ink-400 text-sm">
        No GA4 events yet for <span className="font-mono">app_store_click</span>. Once Vercel deploys + a real click fires, this chart populates within ~30 min.
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce((m, d) => (d.count > m ? d.count : m), 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm text-ink-500">
          Total <span className="font-display font-extrabold text-ink-900 tabular-nums">{total.toLocaleString()}</span>
          <span className="ml-2 text-ink-400">· peak day {peak.toLocaleString()}</span>
        </p>
        {totalLabel && <p className="text-xs text-ink-400">{totalLabel}</p>}
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="installsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F08A3C" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#F08A3C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ead9bf" strokeDasharray="3 6" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(d) => formatDay(d)}
              stroke="#8c7a66"
              fontSize={11}
              tickMargin={6}
            />
            <YAxis stroke="#8c7a66" fontSize={11} allowDecimals={false} width={28} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as InstallsPoint;
                return (
                  <div className="rounded-xl border border-cream-200 bg-white px-3 py-2 shadow-sm text-sm">
                    <p className="font-semibold text-ink-900">{formatDay(p.day, true)}</p>
                    <p className="text-orange-600 font-bold tabular-nums">{p.count.toLocaleString()} clicks</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#F08A3C"
              strokeWidth={2.5}
              fill="url(#installsFill)"
              dot={{ r: 3, strokeWidth: 0, fill: "#F08A3C" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatDay(d: string, long = false): string {
  // d is "YYYYMMDD" from GA4
  if (/^\d{8}$/.test(d)) {
    const dt = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
    return dt.toLocaleDateString("en-US", long ? { weekday: "short", month: "short", day: "numeric" } : { month: "numeric", day: "numeric" });
  }
  return d;
}
