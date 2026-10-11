import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { BRAND } from "@/lib/share";
import { fetchPublicCup, formatCup, standings } from "@/lib/orgs-public";

/** The Cup's link preview: the top five on the members board. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Chapter Cup on Lagoon";

// One accent: gold marks number one (or the kicker, on an empty board).
const MUTED = "rgba(244,241,234,0.72)";
// No params, so Next would prerender it at build time, where there is no
// database to read. Render per request, like the page.
export const dynamic = "force-dynamic";

export default async function Image() {
  const cup = await fetchPublicCup();
  const top = standings(cup, "members").slice(0, 5);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.navy, padding: 64, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: top.length ? MUTED : BRAND.gold }}>
          {`UCSB · ${(cup.season?.name ?? "This season").toUpperCase()} · CHAPTER CUP`}
        </div>
        <div style={{ marginTop: 18, fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>Who&apos;s showing up</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
          {top.length === 0 ? (
            <div style={{ fontSize: 32, color: MUTED }}>The board opens at five members.</div>
          ) : (
            top.map(({ rank, row, value }) => (
              <div key={row.slug} style={{ display: "flex", alignItems: "center", fontSize: 34, marginBottom: 6 }}>
                <span style={{ display: "flex", width: 60, fontWeight: 800, color: rank === 1 ? BRAND.navy : BRAND.cream, background: rank === 1 ? BRAND.gold : "transparent", justifyContent: "center", marginRight: 22 }}>
                  {String(rank)}
                </span>
                <span style={{ display: "flex", width: 120, fontWeight: 800 }}>{row.letters ?? ""}</span>
                <span style={{ display: "flex", flex: 1, fontWeight: 600 }}>{row.name}</span>
                <span style={{ display: "flex", fontWeight: 800 }}>{formatCup(value, "members")}</span>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: "auto", display: "flex", fontSize: 26, fontWeight: 800, color: MUTED }}>
          Lagoon · ranked by what chapters do. No votes.
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
