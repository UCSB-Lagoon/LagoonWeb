import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const KINDS = ["idea", "bug", "praise", "question", "other"] as const;

/**
 * POST /api/feedback — public product-feedback intake.
 * Body: { kind, message, email?, page_path?, app_version? }
 *
 * Always logs (audit). Best-effort Supabase insert. Honeypot supported.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const message = String(body.message ?? "").trim();
  if (message.length < 2 || message.length > 4000) {
    return NextResponse.json({ error: "Message must be 2–4000 chars" }, { status: 400 });
  }
  const kind = KINDS.includes(body.kind as (typeof KINDS)[number])
    ? (body.kind as string)
    : "idea";

  const email = typeof body.email === "string" && body.email.trim()
    ? body.email.trim().toLowerCase().slice(0, 200)
    : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const h = await headers();
  const record = {
    kind,
    message: message.slice(0, 4000),
    email,
    page_path: typeof body.page_path === "string" ? body.page_path.slice(0, 300) : null,
    app_version: typeof body.app_version === "string" ? body.app_version.slice(0, 40) : null,
    user_agent: h.get("user-agent")?.slice(0, 400) || null,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  };

  console.log("[feedback.submit]", JSON.stringify({ ...record, message: record.message.slice(0, 120) }));

  try {
    const supa = await createClient();
    const { data: { user } } = await supa.auth.getUser();
    const { error } = await supa
      .from("feedback")
      .insert({ ...record, user_id: user?.id ?? null } as unknown as never);
    if (error) throw error;
  } catch (e) {
    console.warn("[feedback.submit] insert failed", e);
    // Still return ok — we logged it; never lose the user's words to a 500.
  }

  return NextResponse.json({ ok: true });
}
