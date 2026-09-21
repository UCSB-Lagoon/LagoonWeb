import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  className,
  href,
  hot,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { text: string; tone: "up" | "down" | "flat" };
  icon?: LucideIcon;
  className?: string;
  href?: string;
  hot?: boolean;
}) {
  const card = (
    <div className={cn("card p-5 group h-full", hot && "ring-2 ring-gold-400", className)}>
      <div className="flex items-center gap-2 text-ink-500 text-[11px] uppercase tracking-[0.18em] font-semibold">
        {Icon && (
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-gold-100/70 border border-gold-200/70 text-gold-700 transition-colors group-hover:bg-gold-100 group-hover:border-gold-200">
            <Icon className="w-3 h-3" />
          </span>
        )}
        <span className="leading-none">{label}</span>
      </div>
      <div data-live className="mt-3 font-display text-[2.4rem] leading-none font-bold tabular-nums tracking-[-0.03em] text-ink-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {trend && (
        <p
          data-live
          className={cn(
            "mt-2 text-xs font-semibold leading-snug tabular-nums",
            trend.tone === "up" && "text-success-ink",
            trend.tone === "down" && "text-danger-ink",
            trend.tone === "flat" && "text-ink-500",
          )}
        >
          {trend.text}
        </p>
      )}
      {hint && <div className="mt-2 text-xs text-ink-400 leading-snug">{hint}</div>}
    </div>
  );
  if (!href) return card;
  return (
    <Link href={href} className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700">
      {card}
    </Link>
  );
}
