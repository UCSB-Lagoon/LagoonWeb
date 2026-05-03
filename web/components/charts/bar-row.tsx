type Item = { label: string; value: number; sub?: string; tone?: "primary" | "muted" };

export function BarRow({
  items,
  unit = "",
  max,
  className,
}: {
  items: Item[];
  unit?: string;
  max?: number;
  className?: string;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className={`space-y-2.5 ${className ?? ""}`}>
      {items.map((it, i) => {
        const pct = (it.value / top) * 100;
        const tone = it.tone ?? (i === 0 ? "primary" : "muted");
        return (
          <li key={it.label}>
            <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
              <span className={tone === "primary" ? "font-bold text-ink-900" : "font-medium text-ink-700"}>
                {it.label}
              </span>
              <span className="text-xs text-ink-500 tabular-nums">
                {it.value.toLocaleString()}{unit}
                {it.sub && <span className="text-ink-400"> · {it.sub}</span>}
              </span>
            </div>
            <div className="h-2 rounded-full bg-cream-100 overflow-hidden border border-cream-200">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, pct)}%`,
                  background: tone === "primary"
                    ? "linear-gradient(90deg, var(--color-orange-400), var(--color-orange-600))"
                    : "var(--color-orange-200)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
