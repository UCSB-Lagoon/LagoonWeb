import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public, anonymized, aggregate-only counters for the marketing site (lagoonucsb.com)
// to display on the hero "live data" strip. CORS-open so the static site can fetch it.
// Real numbers only — no presentation floor, no synthetic baselines.

export const runtime = "nodejs";
// Keep equal to STATS_REVALIDATE_SECONDS in lib/stats-helpers.ts and
// `revalidate` on /stats. Next requires this export to be a literal.
export const revalidate = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const sb = await createClient();
    const { data } = await sb.from("stats_overview").select("*").single();
    const body = {
      total_users:       data?.total_users      ?? 0,
      active_users_14d:  data?.active_users_14d ?? 0,
      lifetime_xp:       data?.lifetime_xp      ?? 0,
      top_streak:        data?.top_streak       ?? 0,
      lifetime_events:   data?.lifetime_events  ?? 0,
      badges_earned:     data?.badges_earned    ?? 0,
      generated_at:      new Date().toISOString(),
    };
    return NextResponse.json(body, { headers: CORS });
  } catch {
    return NextResponse.json(
      {
        total_users:      0,
        active_users_14d: 0,
        lifetime_xp:      0,
        top_streak:       0,
        lifetime_events:  0,
        badges_earned:    0,
        generated_at:     new Date().toISOString(),
      },
      { headers: CORS }
    );
  }
}
