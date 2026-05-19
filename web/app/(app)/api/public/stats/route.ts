import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { statsFloor } from "@/lib/public-stats-baseline";

// Public, anonymized, aggregate-only counters for the marketing site (lagoonucsb.com)
// to display on the hero "live data" strip. CORS-open so the static site can fetch it.

export const runtime = "nodejs";
export const revalidate = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Shared presentation floor (single source of truth so this strip and the
// /stats page never contradict each other). See lib/public-stats-baseline.ts.

export async function GET() {
  try {
    const sb = (await createClient()) as any;
    const { data } = await sb.from("stats_overview").select("*").single();
    const b = statsFloor();
    const body = {
      total_users:       Math.max(data?.total_users      ?? 0, b.users),
      active_users_14d:  Math.max(data?.active_users_14d ?? 0, b.active),
      lifetime_xp:       Math.max(data?.lifetime_xp      ?? 0, b.xp),
      top_streak:        Math.max(data?.top_streak       ?? 0, b.streak),
      lifetime_events:   data?.lifetime_events   ?? 0,
      badges_earned:     data?.badges_earned     ?? 0,
      generated_at:      new Date().toISOString(),
    };
    return NextResponse.json(body, { headers: CORS });
  } catch {
    const b = statsFloor();
    return NextResponse.json(
      {
        total_users:      b.users,
        active_users_14d: b.active,
        lifetime_xp:      b.xp,
        top_streak:       b.streak,
        lifetime_events:  0,
        badges_earned:    0,
        generated_at:     new Date().toISOString(),
      },
      { headers: CORS }
    );
  }
}
