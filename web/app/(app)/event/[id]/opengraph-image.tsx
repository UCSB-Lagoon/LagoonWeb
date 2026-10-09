import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { BRAND } from "@/lib/share";
import { categoryTitle, datePlate, fetchPublicOrgEvent, goingLine, hostLabel, whenLine } from "@/lib/orgs-public";

/**
 * A shared event's link preview: who's hosting, the title, when on the gold
 * highlighter, where (a block, for a private house), and how many are going.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A chapter event on Lagoon";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  const event = await fetchPublicOrgEvent(id);
  const plate = event ? datePlate(event.starts_at) : null;
  const going = event ? goingLine(event) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND.navy, padding: 64, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: BRAND.gold }}>
            {event ? `${hostLabel(event)} · ${categoryTitle(event.category)}`.toUpperCase() : "UCSB CHAPTERS"}
          </div>
          <div style={{ marginTop: 26, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
            {event?.title ?? "An event on Lagoon"}
          </div>
          {event ? (
            <div style={{ display: "flex", marginTop: 26 }}>
              <span style={{ background: BRAND.gold, color: BRAND.navy, padding: "2px 12px", fontSize: 36, fontWeight: 800 }}>
                {whenLine(event)}
              </span>
            </div>
          ) : null}
          {event ? (
            <div style={{ marginTop: 18, fontSize: 30, color: "rgba(244,241,234,0.8)" }}>
              {`${event.venue_label}${going ? ` · ${going}` : ""}`}
            </div>
          ) : null}
          <div style={{ marginTop: "auto", display: "flex", fontSize: 26, fontWeight: 800, color: BRAND.gold }}>
            Lagoon · RSVP and see who&apos;s going
          </div>
        </div>
        {plate ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 200, height: 220, borderRadius: 28, background: BRAND.raised }}>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: 3, color: BRAND.coral }}>{plate.month.toUpperCase()}</span>
            <span style={{ fontSize: 110, fontWeight: 800, lineHeight: 1 }}>{plate.day}</span>
          </div>
        ) : null}
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
