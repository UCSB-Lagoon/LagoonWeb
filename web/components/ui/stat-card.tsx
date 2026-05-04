import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("card p-5 group", className)}>
      <div className="flex items-center gap-2 text-ink-500 text-[11px] uppercase tracking-[0.18em] font-semibold">
        {Icon && (
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-100/70 border border-orange-200/70 text-orange-600 transition-colors group-hover:bg-orange-100 group-hover:border-orange-200">
            <Icon className="w-3 h-3" />
          </span>
        )}
        <span className="leading-none">{label}</span>
      </div>
      <div className="mt-3 font-display text-[2.4rem] leading-none font-bold tabular-nums tracking-[-0.03em] text-ink-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint && <div className="mt-2 text-xs text-ink-400 leading-snug">{hint}</div>}
    </div>
  );
}
