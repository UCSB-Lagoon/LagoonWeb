import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { BRAND, DAY_CODES, dayName, fetchFreeGroup, headline, membersLine } from "@/lib/share";

/**
 * The card iMessage, Instagram and Discord show when a /f/ link is pasted:
 * the answer ("Everyone's free Fri 12:15 – 8:00 PM"), who's in, and the
 * week's heatmap — in the app's pinned brand, like its share cards.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "When are we free? — a Lagoon group";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  const group = await fetchFreeGroup(id);
  const h = group ? headline(group) : { lead: "When are we free?" };
  const total = Math.max(1, group?.scheduled_count ?? 1);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND.navy, padding: 64, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 48 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: BRAND.gold }}>
            WHEN ARE WE FREE?
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 68, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
            <span>{h.lead}</span>
            {h.mark ? (
              <span style={{ display: "flex", marginTop: 8 }}>
                <span style={{ background: BRAND.gold, color: BRAND.navy, padding: "0 12px" }}>{h.mark}</span>
              </span>
            ) : null}
          </div>
          <div style={{ marginTop: 32, fontSize: 30, color: "rgba(244,241,234,0.78)" }}>
            {group ? membersLine(group) : "Add your schedule in Lagoon"}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", fontSize: 26, fontWeight: 800, color: BRAND.gold }}>
            Lagoon · add yours and it finds the times
          </div>
        </div>
        {group ? (
          <div style={{ display: "flex", gap: 10, width: 380 }}>
            {DAY_CODES.map((d) => (
              <div key={d} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "rgba(244,241,234,0.6)", height: 36 }}>
                  {dayName(d)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
                  {(group.slots[d] ?? []).map((free, i) => (
                    <div
                      key={i}
                      style={{
                        height: 9.5,
                        background:
                          free >= total ? BRAND.teal : free === 0 ? BRAND.raised : `rgba(134,203,182,${0.25 + 0.45 * (free / total)})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
