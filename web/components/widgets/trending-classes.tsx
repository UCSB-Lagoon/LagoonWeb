import { BookOpen } from "lucide-react";
import type { TrendingClass } from "@/lib/queries";

const MOOD_STYLES: Record<string, string> = {
  Loved:   "bg-kelp-400/15 text-emerald-700 border-emerald-200",
  Solid:   "bg-orange-100 text-orange-700 border-orange-200",
  Steady:  "bg-cream-100 text-ink-500 border-cream-200",
  Heavy:   "bg-amber-50 text-amber-700 border-amber-200",
  Brutal:  "bg-rose-50 text-rose-700 border-rose-200",
};

export function TrendingClassesCard({ rows }: { rows: TrendingClass[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 border border-orange-200 text-orange-600">
          <BookOpen className="w-4 h-4" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900 leading-tight">Class vibes</h3>
          <p className="text-xs text-ink-400">What classes Gauchos are talking about</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-400">No class vibes dropped yet this week.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.course_key}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-cream-100/70 transition"
            >
              <div className="min-w-0">
                <p className="font-display font-bold text-ink-900 tabular-nums">{c.course_key}</p>
                <p className="text-xs text-ink-400">
                  {c.vibes} {c.vibes === 1 ? "vibe" : "vibes"} this week
                </p>
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  MOOD_STYLES[c.mood] ?? MOOD_STYLES.Steady
                }`}
              >
                {c.mood}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
