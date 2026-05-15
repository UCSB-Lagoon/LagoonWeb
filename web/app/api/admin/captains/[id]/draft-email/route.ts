import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { captainAcceptedEmail } from "@/lib/email";

/**
 * GET /api/admin/captains/[id]/draft-email
 *
 * Returns a mailto: URL pre-filled with the acceptance email body for the
 * given application. Used by the "Open email" button on accepted-but-not-
 * yet-emailed rows. Admin clicks → their default mail client opens fully
 * composed → they hit Send → come back and click "Mark sent".
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("captain_applications")
    .select("id, name, email, captain_code")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  }
  const row = data as { name: string; email: string; captain_code: string | null };
  if (!row.captain_code) {
    return NextResponse.json({ error: "Captain code not yet issued" }, { status: 400 });
  }

  const tpl = captainAcceptedEmail({ name: row.name, code: row.captain_code });
  const qs = new URLSearchParams({ subject: tpl.subject, body: tpl.text });
  return NextResponse.json({
    mailto_url: `mailto:${encodeURIComponent(row.email)}?${qs.toString()}`,
    subject: tpl.subject,
    code: row.captain_code,
  });
}
