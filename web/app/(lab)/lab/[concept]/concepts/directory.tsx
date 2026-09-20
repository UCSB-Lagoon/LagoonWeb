import Link from "next/link";
import { Search } from "lucide-react";
import { getStatsBundle, getTrendingClasses } from "@/lib/queries";
import { prettifyMajor, pct } from "@/lib/stats-helpers";

/**
 * "Course directory" — the site is a UCSB reference that happens to have an app.
 *
 * The argument: every other concept here competes for attention Lagoon has to
 * buy. This one competes for attention students already spend — nobody searches
 * "UCSB campus app", but they search a course code before every add/drop
 * deadline. The 29 SEO guides already bet on this; the concept is to make it
 * the spine of the site rather than a side wing.
 *
 * The honest problem, shown rather than hidden: a directory needs coverage, and
 * Lagoon currently has vibes on a handful of courses. The empty rows below are
 * the point — this concept is a content-pipeline commitment wearing a design,
 * and week 0 is the wrong time to take it.
 */
export async function DirectoryConcept() {
  const [s, trending] = await Promise.all([getStatsBundle(), getTrendingClasses(8)]);
  const totalProfiles = s.majors.reduce((a, b) => a + b.users, 0);
  const majors = s.majors.filter((m) => m.major_code !== "Undeclared").slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <h1 className="font-display text-5xl font-bold tracking-[-0.03em] leading-[0.98] max-w-2xl">
        Every UCSB course,
        <br />
        <span className="text-ink-500">rated by the people taking it.</span>
      </h1>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-cream-200 bg-panel-elevated px-4 py-3 max-w-xl">
        <Search className="w-4 h-4 text-ink-400 shrink-0" />
        <span className="text-ink-400 text-sm font-mono">CMPSC 16, PSTAT 120A, WRIT 2…</span>
      </div>
      <p className="text-xs text-ink-400 mt-2">
        Non-functional mock. Real search needs the course table wired up first.
      </p>

      <section className="mt-12">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg font-bold">Courses with vibes logged</h2>
          <span className="text-xs text-ink-400">the honest coverage today</span>
        </div>
        <p className="text-xs text-ink-400 mb-4 max-w-2xl leading-relaxed">
          A directory lives or dies on coverage. This is the real count — the gap
          between it and ~4,000 UCSB courses is the actual cost of this concept.
        </p>
        {trending.length === 0 ? (
          <p className="text-sm text-ink-400">No vibes logged yet.</p>
        ) : (
          <ul data-live className="grid sm:grid-cols-2 gap-2">
            {trending.map((t) => (
              <li
                key={t.course_key}
                className="card p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-sm truncate">{t.course_key}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mt-0.5">
                    {t.mood}
                  </p>
                </div>
                <span className="text-xs font-bold text-gold-700 tabular-nums shrink-0">
                  {t.vibes} vibe{t.vibes === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold mb-1">Browse by major</h2>
        <p className="text-xs text-ink-400 mb-4">
          Weighted by who has actually signed up, so the directory grows where the
          users already are.
        </p>
        <ul data-live className="flex flex-wrap gap-2">
          {majors.map((m) => (
            <li
              key={m.major_code}
              className="rounded-full border border-cream-200 bg-panel px-3.5 py-1.5 text-sm"
            >
              {prettifyMajor(m.major_code)}
              <span className="text-ink-400 tabular-nums ml-1.5 text-xs">
                {pct(m.users, totalProfiles).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="card-tinted p-5 mt-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
          Why this is not the week-0 answer
        </p>
        <p className="text-sm text-ink-700 mt-2 leading-relaxed max-w-2xl">
          This is the only concept here that compounds without downloads — search
          traffic keeps arriving after you stop flyering. It is also the only one
          that needs a content pipeline before it does anything at all, and the
          existing <Link href="/guides" className="text-gold-700 font-semibold hover:underline">29 guides</Link> are
          already the cheap version of this bet. Worth revisiting once there is
          enough vibe coverage for a course page to be worth landing on.
        </p>
      </div>
    </div>
  );
}
