import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONCEPTS } from "./concepts";
import { getStatsBundle } from "@/lib/queries";
import { UCSB_UNDERGRAD_ENROLLMENT, pct } from "@/lib/stats-helpers";

export const revalidate = 120;
export const metadata = { title: "Concepts" };

/**
 * The index deliberately shows the real numbers at the top.
 *
 * Every concept below has to work at this scale, and the fastest way to kill
 * a design that only looks good with invented traction is to put the true
 * figures next to it before you start.
 */
export default async function LabIndex() {
  const s = await getStatsBundle();
  const ov = s.overview;
  const reach = ov ? pct(ov.total_users, UCSB_UNDERGRAD_ENROLLMENT) : 0;

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <h1 className="font-display text-4xl font-bold tracking-tight">Design lab</h1>
      <p className="text-sm text-ink-500 mt-2 max-w-2xl leading-relaxed">
        Whole-concept explorations, rendered against the live database through the
        same queries the real site uses. Nothing here is linked from the product,
        indexed, or served in production.
      </p>

      <div className="card p-5 mt-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
          What every concept has to work at
        </p>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          <Figure value={ov?.total_users ?? 0} label="signed-up Gauchos" />
          <Figure value={ov?.active_users_14d ?? 0} label="active in 14 days" />
          <Figure value={`${reach.toFixed(2)}%`} label="of UCSB undergrads" />
        </div>
        <p className="text-xs text-ink-400 mt-4 leading-relaxed">
          These are the real figures, not placeholders. A concept that needs
          bigger ones to feel good is telling you something.
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {CONCEPTS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/lab/${c.slug}`}
              className="card p-5 flex items-start gap-4 hover:border-gold-300 transition group"
            >
              <div className="flex-1">
                <p className="font-display text-xl font-bold">{c.name}</p>
                <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{c.thesis}</p>
                <p className="text-xs text-ink-400 mt-2">
                  <span className="font-semibold uppercase tracking-wider">Cost</span> · {c.cost}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-gold-700 shrink-0 mt-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div data-live className="font-display text-3xl font-bold tabular-nums leading-none">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-ink-400 mt-1">{label}</div>
    </div>
  );
}
