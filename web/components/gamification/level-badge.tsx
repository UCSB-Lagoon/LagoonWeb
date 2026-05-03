import { levelDisplay } from "@/lib/gamification/levels";
import { cn } from "@/lib/utils";

export function LevelBadge({ level, size = "md" }: { level: number; size?: "sm" | "md" | "lg" }) {
  const lvl = levelDisplay(level);
  const dim = { sm: "w-9 h-9 text-base", md: "w-12 h-12 text-xl", lg: "w-20 h-20 text-3xl" }[size];
  return (
    <div
      className={cn(
        "rounded-2xl grid place-items-center bg-orange-100 border border-orange-200 text-orange-700",
        dim,
      )}
      title={`Level ${lvl.rank} · ${lvl.name}`}
    >
      <span>{lvl.emoji}</span>
    </div>
  );
}
