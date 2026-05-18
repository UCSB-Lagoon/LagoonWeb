"use client";

import {
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell,
} from "recharts";

export type FunnelStage = { stage: string; value: number; hint?: string };

const COLORS = ["#003660", "#FEBC11", "#C8754C", "#003660", "#1B2430"];

export function CaptainFunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (!stages.length || stages.every((s) => s.value === 0)) {
    return (
      <div className="text-center py-12 text-ink-400 text-sm">
        No funnel data yet. Share a <span className="font-mono">/r/&lt;code&gt;</span> link to start collecting.
      </div>
    );
  }
  // Filter out zero stages at the tail so the funnel doesn't collapse to nothing,
  // but keep them in the legend below
  const data = stages.map((s, i) => ({
    name: s.stage,
    value: Math.max(s.value, 0.01),     // tiny non-zero so the band still renders
    actual: s.value,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { name: string; actual: number };
                return (
                  <div className="rounded-xl border border-cream-200 bg-white px-3 py-2 shadow-sm text-sm">
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    <p className="text-orange-600 font-bold tabular-nums">{p.actual.toLocaleString()}</p>
                  </div>
                );
              }}
            />
            <Funnel dataKey="value" data={data} isAnimationActive>
              <LabelList
                position="right"
                fill="#1B2430"
                stroke="none"
                dataKey="name"
                fontSize={12}
                fontWeight={600}
              />
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      {/* Compact legend / detail strip */}
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((s, i) => (
          <li
            key={s.stage}
            className="rounded-xl border border-cream-200 bg-cream-100/40 px-3 py-2 flex items-center gap-2"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400 truncate">{s.stage}</p>
              <p className="font-display font-extrabold text-ink-900 tabular-nums">{s.value.toLocaleString()}</p>
              {s.hint && <p className="text-[10px] text-ink-400 truncate">{s.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
