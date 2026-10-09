import Link from "next/link";
import { categoryTitle, datePlate, goingLine, whenLine, type PublicOrgEvent } from "@/lib/orgs-public";

/** A chapter's upcoming events: date plate, title, when and where, going. */
export function OrgEventList({ events }: { events: PublicOrgEvent[] }) {
  return (
    <ul className="mt-3 divide-y divide-cream-200 border-y border-cream-200">
      {events.map((e) => {
        const plate = datePlate(e.starts_at);
        const going = goingLine(e);
        return (
          <li key={e.id}>
            <Link href={`/event/${e.id}`} className="flex gap-4 py-4 group">
              <span className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-cream-200 py-1.5 text-ink-900">
                <span className="text-[11px] font-black uppercase tracking-wider text-ink-500">{plate.month}</span>
                <span className="font-mono text-xl leading-tight">{plate.day}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-ink-500">{categoryTitle(e.category)}</span>
                <span className="block font-semibold text-ink-900 group-hover:underline underline-offset-4">{e.title}</span>
                <span className="block text-sm text-ink-500 truncate">
                  {whenLine(e)} · {e.venue_label}
                </span>
                {going ? <span className="block text-sm text-ink-700">{going}</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
