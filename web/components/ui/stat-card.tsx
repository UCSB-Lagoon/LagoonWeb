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
    <div className={cn("card p-5", className)}>
      <div className="flex items-center gap-2 text-ink-500 text-xs uppercase tracking-[0.18em] font-semibold">
        {Icon && <Icon className="w-3.5 h-3.5 text-orange-500" />}
        {label}
      </div>
      <div className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight text-ink-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}
