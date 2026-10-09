import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { BRAND } from "@/lib/share";
import { councilTitle, fetchPublicOrg, whenLine } from "@/lib/orgs-public";

/**
 * The card a chapter's invite link unfurls into in the group chat: letters
 * on the gold highlighter, the name, and the next event if there is one.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A UCSB chapter on Lagoon";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await params;
  const org = await fetchPublicOrg(slug);
  const next = org?.upcoming_events[0];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.navy, padding: 64, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: BRAND.gold }}>
          {org ? `UCSB · ${councilTitle(org.council).toUpperCase()}` : "UCSB CHAPTERS"}
        </div>
        {org?.letters ? (
          <div style={{ display: "flex", marginTop: 30 }}>
            <span style={{ background: BRAND.gold, color: BRAND.navy, padding: "0 18px", fontSize: 128, fontWeight: 800, lineHeight: 1.1 }}>
              {org.letters}
            </span>
          </div>
        ) : null}
        <div style={{ marginTop: org?.letters ? 18 : 30, fontSize: org?.letters ? 64 : 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
          {org?.name ?? "Chapters at UCSB"}
        </div>
        {next ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 30, color: "rgba(244,241,234,0.8)" }}>
            <span style={{ fontWeight: 800, color: BRAND.cream }}>Next: {next.title}</span>
            <span>{whenLine(next)} · {next.venue_label}</span>
          </div>
        ) : null}
        <div style={{ marginTop: "auto", display: "flex", fontSize: 26, fontWeight: 800, color: BRAND.gold }}>
          Lagoon · events, RSVPs, and who you know
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
