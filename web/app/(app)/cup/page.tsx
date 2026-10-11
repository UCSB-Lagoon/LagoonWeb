import type { Metadata } from "next";
import Link from "next/link";
import { ShareCTA } from "@/components/share/share-cta";
import { logShareClick } from "@/lib/share-click";
import { councilShort, fetchPublicCup, formatCup, standings, type CupBoard } from "@/lib/orgs-public";

/**
 * /cup — the Chapter Cup (iOS migration 093). Chapters ranked by what they
 * do: verified members on Lagoon, RSVPs to their reviewed events, and money
 * raised that Lagoon verified. No votes, no reviews. This is where a member's
 * "we're #2" share lands.
 */

type Params = { searchParams: Promise<{ board?: string; r?: string; s?: string; demo?: string }> };

export const dynamic = "force-dynamic";

const BOARDS: { id: CupBoard; title: string; unit: string }[] = [
  { id: "members", title: "Members", unit: "verified members on Lagoon" },
  { id: "turnout", title: "Turnout", unit: "RSVPs to its events this season" },
  { id: "raised", title: "Raised", unit: "raised for its philanthropy this season" },
];

export async function generateMetadata(): Promise<Metadata> {
  const cup = await fetchPublicCup();
  const leader = standings(cup, "members")[0];
  const title = `Chapter Cup${cup.season ? ` · ${cup.season.name}` : ""} · Lagoon`;
  const description = leader
    ? `${leader.row.letters ?? leader.row.name} leads with ${leader.value} verified members. UCSB chapters ranked by what they do, never by what anyone says about them.`
    : "UCSB chapters ranked by what they do: members on Lagoon, turnout at their events, and money raised. No votes, no reviews.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "https://lagoonucsb.com/cup" },
    openGraph: { type: "website", siteName: "Lagoon", title, description, url: "https://lagoonucsb.com/cup" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CupPage({ searchParams }: Params) {
  const { board: rawBoard, r, s, demo } = await searchParams;
  const board: CupBoard = rawBoard === "turnout" || rawBoard === "raised" ? rawBoard : "members";
  const cup = await fetchPublicCup(demo === "1");
  await logShareClick("/cup", r, s || "cup");
  const rows = standings(cup, board);
  const meta = BOARDS.find((b) => b.id === board)!;

  return (
    <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
      <p className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">
        {cup.season?.name ?? "This season"} · Chapter Cup
      </p>
      <h1 className="mt-3 font-display text-[40px] sm:text-[52px] leading-[1.02] font-extrabold tracking-[-0.03em] text-ink-900">
        Who&apos;s showing up
      </h1>
      <p className="mt-3 text-base text-ink-500">Ranked by what chapters do, never by what anyone says about them.</p>

      <nav className="mt-8 flex gap-2" aria-label="Board">
        {BOARDS.map((b) => (
          <Link
            key={b.id}
            href={b.id === "members" ? "/cup" : `/cup?board=${b.id}`}
            aria-current={b.id === board ? "page" : undefined}
            className={
              b.id === board
                ? "rounded-full px-4 py-2 text-sm font-semibold bg-ink-900 text-cream-50"
                : "rounded-full px-4 py-2 text-sm font-semibold border border-cream-200 text-ink-700"
            }
          >
            {b.title}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-base text-ink-500">
          {board === "members"
            ? "No chapter is on the board yet. A chapter joins at five verified members on Lagoon."
            : "Nothing on this board yet this season."}
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-cream-200 border-y border-cream-200">
          {rows.map(({ rank, row, value }) => (
            <li key={row.slug}>
              <Link href={`/org/${row.slug}`} className="flex items-center gap-4 py-4 group">
                <span className="w-7 font-mono text-lg font-bold text-ink-400">{rank}</span>
                <span className="w-12 font-mono text-ink-700">{row.letters ?? ""}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900 group-hover:underline underline-offset-4">{row.name}</span>
                  <span className="block text-sm text-ink-500">{councilShort(row.council)}</span>
                </span>
                <span className="font-mono text-lg font-semibold text-ink-900">{formatCup(value, board)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {rows.length > 0 && <p className="mt-3 text-xs text-ink-400">Each number: {meta.unit}.</p>}

      <ShareCTA
        kind="cup"
        appPath="cup"
        label="Count for your chapter — get Lagoon free"
        note="Join your chapter on Lagoon with your UCSB email and you count toward its members."
      />

      <section className="mt-12 text-sm text-ink-500 space-y-2">
        <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">How it&apos;s counted</h2>
        <p>
          Members are Lagoon accounts with a UCSB email that say they&apos;re in the chapter, shown from five. Turnout counts
          RSVPs to the chapter&apos;s events, each reviewed by Lagoon. Raised counts amounts an officer reported and Lagoon
          verified. There are no votes, no reviews and no comments.
        </p>
        <p>
          <Link href="/" className="underline underline-offset-2">What&apos;s Lagoon?</Link>
        </p>
      </section>
    </div>
  );
}
