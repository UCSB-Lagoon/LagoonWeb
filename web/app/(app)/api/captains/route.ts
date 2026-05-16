import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import type { Database } from "@/types/database";

type CaptainInsert = Database["public"]["Tables"]["captain_applications"]["Insert"];

/**
 * POST /api/captains — captain-program application submissions.
 *
 * Storage strategy:
 *   - If Supabase `captain_applications` table exists, insert there.
 *   - Otherwise (and always, as audit) log to stderr so it lands in Vercel logs.
 *
 * Future: pipe to Resend / Slack webhook for instant founder notification.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["name", "email", "year", "major", "pitch"];
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string" || !(body[k] as string).trim()) {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }

  const email = String(body.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  // Honeypot
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const jar = await cookies();
  const referral = jar.get("lagoon_ref")?.value || null;
  const hdrs = await headers();
  const ua = hdrs.get("user-agent") || null;
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() || null;

  const record: CaptainInsert = {
    name: String(body.name).slice(0, 120),
    email: email.slice(0, 200),
    year: String(body.year).slice(0, 40),
    major: String(body.major).slice(0, 120),
    instagram: typeof body.instagram === "string" ? body.instagram.slice(0, 80) : null,
    pitch: String(body.pitch).slice(0, 2000),
    why: typeof body.why === "string" ? body.why.slice(0, 2000) : null,
    referral_code: referral,
    user_agent: ua,
    ip,
    submitted_at: new Date().toISOString(),
  };

  // Always log — stderr ends up in Vercel function logs
  console.log("[captains.apply]", JSON.stringify(record));

  // Best-effort Supabase insert (no-op if table missing or env vars not set)
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createClient } = await import("@/lib/supabase/server");
      const supa = await createClient();
      // Generated Database type loses Insert typing because the shared server
      // client doesn't pass the PostgrestVersion type param. Cast scoped to
      // just this call site.
      const { error } = await supa
        .from("captain_applications")
        .insert(record as unknown as never);
      if (error) throw error;
    }
  } catch (e) {
    // Don't fail the request — we still have the log
    console.warn("[captains.apply] supabase insert failed", e);
  }

  return NextResponse.json({ ok: true });
}
