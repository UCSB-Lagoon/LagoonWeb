import { DAY_CODES, dayName, clock, type SharedWeekBlock } from "@/lib/share";

/** The app stores one of four hexes per block; map it onto the matching token. */
function courseFill(hex: string): string {
  switch (hex.toUpperCase()) {
    case "EFDC7B": return "var(--color-course-gold)";
    case "E9A196": return "var(--color-course-coral)";
    case "B2A2E0": return "var(--color-course-violet)";
    default: return "var(--color-course-teal)";
  }
}

/** A shared week as five columns of course blocks, 8 AM to the last class. */
export function WeekGrid({ blocks }: { blocks: SharedWeekBlock[] }) {
  const start = Math.min(480, ...blocks.map((b) => Math.floor(b.s / 60) * 60));
  const end = Math.max(1080, ...blocks.map((b) => Math.ceil(b.e / 60) * 60));
  const pxPerMinute = 0.75;
  const height = (end - start) * pxPerMinute;
  const hours: number[] = [];
  for (let m = start; m <= end; m += 120) hours.push(m);

  return (
    <div className="flex gap-2">
      <div className="relative w-8 shrink-0 text-[10px] font-mono text-ink-400" style={{ height: height + 24 }} aria-hidden="true">
        {hours.map((m) => (
          <span key={m} className="absolute right-0" style={{ top: 24 + (m - start) * pxPerMinute - 6 }}>
            {clock(m, true).replace(":00", "")}
          </span>
        ))}
      </div>
      {DAY_CODES.map((d) => (
        <div key={d} className="flex-1 min-w-0">
          <div className="h-6 text-center text-xs font-bold text-ink-500">{dayName(d)}</div>
          <div className="relative rounded-lg border border-cream-200 bg-cream-100" style={{ height }}>
            {blocks
              .filter((b) => b.d === d)
              .map((b, i) => (
                <div
                  key={i}
                  className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden"
                  style={{ top: (b.s - start) * pxPerMinute, height: Math.max(18, (b.e - b.s) * pxPerMinute), background: courseFill(b.h), color: "var(--color-course-ink)" }}
                  title={`${b.c} · ${clock(b.s)}–${clock(b.e)}${b.l ? ` · ${b.l}` : ""}`}
                >
                  <div className="text-[10px] font-black leading-tight">{b.c}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
