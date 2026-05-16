import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { uniqueCaptainCode } from "@/lib/captain-code";
import { sendEmail, captainAcceptedEmail } from "@/lib/email";

const ALLOWED = ["new", "reviewing", "accepted", "rejected", "withdrawn"] as const;
type Status = (typeof ALLOWED)[number];

type ApplicationRow = {
  id: string;
  name: string;
  email: string;
  status: Status;
  captain_code: string | null;
  accepted_email_sent_at: string | null;
};

/**
 * PATCH /api/admin/captains/[id]
 * Body: { status: Status, reviewer_notes?: string }
 *
 * Auth: must be signed in via Supabase magic link AND email must be in
 * ADMIN_EMAILS (see web/lib/supabase/admin.ts).
 *
 * Side effects when status transitions to "accepted":
 *   1. Generate a unique captain_code if one isn't already set
 *   2. Send the captain their /r/{code} email (idempotent via accepted_email_sent_at)
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
  const nextStatus = body.status as Status;

  const admin = createAdminClient();

  // Load current row so we can decide whether to issue code + send email
  const { data: existing, error: loadErr } = await admin
    .from("captain_applications")
    .select("id, name, email, status, captain_code, accepted_email_sent_at")
    .eq("id", id)
    .single();
  if (loadErr || !existing) {
    return NextResponse.json({ error: loadErr?.message || "Not found" }, { status: 404 });
  }
  const row = existing as unknown as ApplicationRow;

  const patch: Record<string, unknown> = { status: nextStatus };
  if (typeof body.reviewer_notes === "string") {
    patch.reviewer_notes = body.reviewer_notes.slice(0, 4000);
  }

  // ── Accept workflow ─────────────────────────────────────────────────────
  let issuedCode: string | null = null;
  let emailResult: { ok: boolean; skipped?: boolean; error?: string } | null = null;
  let mailtoUrl: string | null = null;

  if (nextStatus === "accepted") {
    // 1) Mint a code if one isn't already set
    let code = row.captain_code;
    if (!code) {
      code = await uniqueCaptainCode(async (candidate) => {
        const { count } = await admin
          .from("captain_applications")
          .select("id", { count: "exact", head: true })
          .ilike("captain_code", candidate);
        return (count ?? 0) > 0;
      });
      patch.captain_code = code;
      issuedCode = code;
    }

    // 2) Send acceptance email if we haven't yet — try Resend first, else
    //    build a mailto: link so the admin can send from their own client.
    if (!row.accepted_email_sent_at) {
      const tpl = captainAcceptedEmail({ name: row.name, code });

      if (process.env.RESEND_API_KEY) {
        // Auto-send via Resend (optional path; zero setup if skipped)
        const result = await sendEmail({
          to: row.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          replyTo: "team@lagoonucsb.com",
          tags: { workflow: "captain_accept", captain_code: code },
        });
        emailResult = result.ok
          ? { ok: true }
          : "skipped" in result
            ? { ok: false, skipped: true, error: result.reason }
            : { ok: false, error: result.error };
        if (result.ok) {
          patch.accepted_email_sent_at = new Date().toISOString();
        }
      } else {
        // Default zero-setup path: hand back a mailto link the UI opens.
        // The admin sends from their own mail client; clicks "Mark sent" after.
        emailResult = { ok: false, skipped: true, error: "Click-to-send (Resend not configured)" };
        const params = new URLSearchParams({
          subject: tpl.subject,
          body: tpl.text,
        });
        mailtoUrl = `mailto:${encodeURIComponent(row.email)}?${params.toString()}`;
      }
    }
  }

  const { error } = await admin
    .from("captain_applications")
    .update(patch as never)
    .eq("id", id);

  if (error) {
    console.error("[admin.captains.patch]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    issued_code: issuedCode,
    email: emailResult,
    mailto_url: mailtoUrl,
  });
}

// POST /api/admin/captains/[id]?action=mark-emailed — manually record that
// the click-to-send email was actually sent. No body needed.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action !== "mark-emailed") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("captain_applications")
    .update({ accepted_email_sent_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
