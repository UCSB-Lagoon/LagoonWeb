import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
  accent = "#22d3ee",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
  accent?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5 relative overflow-hidden", className)}>
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2 text-mist/60 text-sm">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className="mt-2 text-3xl font-display font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint && <div className="mt-1 text-xs text-mist/50">{hint}</div>}
    </div>
  );
}
