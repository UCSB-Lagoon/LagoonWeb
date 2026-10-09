import { DAY_CODES, dayName, type FreeGroup } from "@/lib/share";

/** Mon–Fri × 8 AM–8 PM, one row per 15 minutes, teal by how many are free. */
export function FreeHeatmap({ group }: { group: FreeGroup }) {
  const total = Math.max(1, group.scheduled_count);
  const hours = [8, 10, 12, 14, 16, 18];
  return (
    <div className="flex gap-2" aria-hidden="true">
      <div className="flex flex-col pt-6 text-[10px] font-mono text-ink-400">
        {hours.map((h) => (
          <div key={h} style={{ height: 48 }}>
            {h % 12 === 0 ? 12 : h % 12}
            {h < 12 ? "a" : "p"}
          </div>
        ))}
      </div>
      {DAY_CODES.map((d) => (
        <div key={d} className="flex-1 min-w-0">
          <div className="h-6 text-center text-xs font-bold text-ink-500">{dayName(d)}</div>
          <div className="rounded-lg overflow-hidden border border-cream-200">
            {(group.slots[d] ?? []).map((free, i) => {
              const share = free / total;
              // Partial slots: the hue at partial strength over the page,
              // via color-mix so dark mode mixes into the night ground.
              const bg =
                free >= total
                  ? "var(--color-course-teal)"
                  : free === 0
                    ? "var(--color-cream-200)"
                    : `color-mix(in srgb, var(--color-course-teal) ${Math.round((0.25 + 0.45 * share) * 100)}%, var(--color-cream-50))`;
              return <div key={i} style={{ height: 6, background: bg }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
