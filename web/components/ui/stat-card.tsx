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
    <div className={cn("glass rounded-[1.35rem] p-5 relative overflow-hidden group", className)}>
      <div
        className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-30 blur-2xl transition group-hover:opacity-45"
        style={{ background: accent }}
      />
      <div className="relative flex items-center gap-2 text-mist/60 text-sm">
        {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
        {label}
      </div>
      <div className="relative mt-2 text-4xl font-display font-extrabold tracking-[-0.04em] tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {hint && <div className="relative mt-1 text-xs text-mist/50">{hint}</div>}
    </div>
  );
}
