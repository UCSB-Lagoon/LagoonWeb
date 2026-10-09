import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { BRAND, DAY_CODES, courseList, dayName, fetchSharedWeek } from "@/lib/share";

/** The link preview for /w/: the week itself, in the app's pinned brand. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A week on Lagoon";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  const week = await fetchSharedWeek(id);
  const blocks = week?.blocks ?? [];
  const start = Math.min(480, ...blocks.map((b) => Math.floor(b.s / 60) * 60));
  const end = Math.max(1080, ...blocks.map((b) => Math.ceil(b.e / 60) * 60));
  const scale = 430 / (end - start);
  const title = week ? `${week.owner_name}'s ${week.kind === "plan" ? (week.quarter_name ?? "plan") : "week"}` : "A week on Lagoon";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND.navy, padding: 64, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 520, paddingRight: 40 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: BRAND.gold }}>
            {`UCSB${week?.quarter_name ? ` · ${week.quarter_name.toUpperCase()}` : ""}`}
          </div>
          <div style={{ marginTop: 24, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{title}</div>
          <div style={{ marginTop: 24, fontSize: 30, color: "rgba(244,241,234,0.78)" }}>{week ? courseList(week) : ""}</div>
          <div style={{ marginTop: "auto", fontSize: 26, fontWeight: 800, color: BRAND.gold }}>
            {week?.kind === "plan" ? "Lagoon · taking any of these?" : "Lagoon · when are we free?"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          {DAY_CODES.map((d) => (
            <div key={d} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "rgba(244,241,234,0.6)", height: 36 }}>
                {dayName(d)}
              </div>
              <div style={{ display: "flex", position: "relative", height: 430, borderRadius: 14, background: BRAND.raised }}>
                {blocks
                  .filter((b) => b.d === d)
                  .map((b, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: 4,
                        right: 4,
                        top: (b.s - start) * scale,
                        height: Math.max(24, (b.e - b.s) * scale),
                        borderRadius: 8,
                        background: `#${b.h}`,
                        color: BRAND.navy,
                        fontSize: 15,
                        fontWeight: 800,
                        padding: "4px 6px",
                        display: "flex",
                      }}
                    >
                      {b.c}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
