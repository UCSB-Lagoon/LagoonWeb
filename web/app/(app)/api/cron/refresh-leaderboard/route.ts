import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Backup refresher hit once a day by Vercel Cron (Hobby plan caps at daily).
 * The primary, hourly refresh runs inside Supabase via pg_cron — see
 * supabase/migrations/0003_pg_cron_leaderboard.sql. This route stays as a
 * safety net + manual-trigger endpoint. Auth via CRON_SECRET header.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
  const { error } = await sb.rpc("refresh_leaderboard_weekly");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() });
}
