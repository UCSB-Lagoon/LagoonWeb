import { ImageResponse } from "next/og";
import { getCampusStats } from "@/lib/queries";
import { ogFonts } from "@/lib/og-font";
import { BRAND } from "@/lib/share";

const size = { width: 1200, height: 630 };
export const revalidate = 30;

export async function GET() {
  // Reuse the public aggregate; never seed counts when the query fails.
  const stats = await getCampusStats().catch(() => null);
  const count = stats?.totals?.gauchos;
  const hasCount = typeof count === "number" && Number.isFinite(count) && count >= 0;
  const growth = (stats?.growth ?? []).filter((point) => Number.isFinite(point.total) && point.total >= 0);
  const max = growth.reduce((highest, point) => Math.max(highest, point.total), 1);
  const points = growth.map((point, i) => ({
    x: 16 + (i / Math.max(1, growth.length - 1)) * 432,
    y: 240 - (point.total / max) * 208,
  }));
  const line = points.map(({ x, y }, i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  const fonts = await ogFonts();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 60, background: BRAND.navy, color: BRAND.cream, fontFamily: "Inter" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 800 }}>
          <span style={{ color: BRAND.gold }}>LAGOON / BY THE NUMBERS</span>
          <span style={{ color: BRAND.teal }}>{stats ? "LIVE · ANONYMIZED" : "UCSB · ANONYMIZED"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 570 }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>Campus by the numbers.</div>
            <div style={{ fontSize: hasCount ? 124 : 60, fontWeight: 800, letterSpacing: hasCount ? -5 : -2, color: BRAND.gold, marginTop: 22, lineHeight: 1.1 }}>
              {hasCount ? count.toLocaleString("en-US") : "Check back soon"}
            </div>
            <div style={{ fontSize: 32, marginTop: 12 }}>
              {hasCount ? "Gauchos on Lagoon" : "Numbers are taking a breather."}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 470, padding: 20, background: BRAND.raised, borderRadius: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.gold }}>THE CLIMB</div>
            {points.length > 1 ? (
              <svg width="460" height="270" viewBox="0 0 460 270" style={{ marginLeft: -15, marginTop: 16 }}>
                <line x1="16" y1="240" x2="448" y2="240" stroke={BRAND.cream} strokeOpacity="0.2" />
                <path d={`${line} L448,240 L16,240 Z`} fill={BRAND.gold} fillOpacity="0.12" />
                <path d={line} fill="none" stroke={BRAND.gold} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last.x} cy={last.y} r="8" fill={BRAND.gold} />
              </svg>
            ) : (
              <div style={{ display: "flex", height: 286, alignItems: "center", fontSize: 30, lineHeight: 1.3 }}>
                {points.length === 1 ? "The climb starts here." : "Growth chart coming soon."}
              </div>
            )}
            <div style={{ fontSize: 20 }}>Cumulative sign-ups · Lagoon users only</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${BRAND.raised}`, paddingTop: 22, fontSize: 22 }}>
          <span>Real counts. A campus taking shape.</span>
          <span style={{ color: BRAND.gold, fontWeight: 800 }}>lagoonucsb.com/stats ↗</span>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
