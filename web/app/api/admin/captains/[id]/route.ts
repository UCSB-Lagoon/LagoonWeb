import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

const ALLOWED = ["new", "reviewing", "accepted", "rejected", "withdrawn"] as const;
type Status = (typeof ALLOWED)[number];

/**
 * PATCH /api/admin/captains/[id]
 * Body: { status: Status, reviewer_notes?: string }
 *
 * Auth: must be signed in via Supabase magic link AND email must be in
 * ADMIN_EMAILS (see web/lib/supabase/admin.ts).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: string; reviewer_notes?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!ALLOWED.includes(body.status as Status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { status: body.status };
  if (typeof body.reviewer_notes === "string") {
    patch.reviewer_notes = body.reviewer_notes.slice(0, 4000);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("captain_applications")
    .update(patch)
    .eq("id", id);

  if (error) {
    console.error("[admin.captains.patch]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
