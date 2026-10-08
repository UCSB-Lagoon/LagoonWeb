import { NextResponse } from "next/server";
import { callAdminRpc, requireAdmin, UUID_RE } from "@/lib/admin-rpc";

/**
 * POST /api/admin/events
 *   { action: "review", event_id, approve: boolean, reason? }
 *   { action: "status", event_id, status: approved|hidden }   (after reports)
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventId = typeof body.event_id === "string" && UUID_RE.test(body.event_id) ? body.event_id : null;
  if (!eventId) return NextResponse.json({ error: "Bad event_id" }, { status: 400 });

  if (body.action === "review" && typeof body.approve === "boolean") {
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 300) : null;
    if (!body.approve && !reason) {
      return NextResponse.json({ error: "A rejection needs a reason — the officer sees it." }, { status: 400 });
    }
    return callAdminRpc("admin_org_event_review", { p_id: eventId, p_approve: body.approve, p_reason: reason });
  }
  if (body.action === "status" && ["approved", "hidden"].includes(body.status as string)) {
    return callAdminRpc("admin_org_event_set_status", { p_id: eventId, p_status: body.status });
  }
  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
