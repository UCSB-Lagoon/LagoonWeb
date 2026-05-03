import { levelDisplay } from "@/lib/gamification/levels";
import { cn } from "@/lib/utils";

export function LevelBadge({ level, size = "md" }: { level: number; size?: "sm" | "md" | "lg" }) {
  const lvl = levelDisplay(level);
  const dim = { sm: "w-8 h-8 text-base", md: "w-12 h-12 text-xl", lg: "w-20 h-20 text-3xl" }[size];
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-deep",
        dim,
      )}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${lvl.color}40, transparent 70%), rgba(255,255,255,0.04)`,
        boxShadow: `0 0 30px -5px ${lvl.color}80`,
        ['--tw-ring-color' as string]: `${lvl.color}99`,
      }}
      title={`Level ${lvl.rank} · ${lvl.name}`}
    >
      <span>{lvl.emoji}</span>
    </div>
  );
}
