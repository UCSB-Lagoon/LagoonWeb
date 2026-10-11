import { NextResponse } from "next/server";
import { callAdminRpc, requireAdmin, UUID_RE } from "@/lib/admin-rpc";

/**
 * POST /api/admin/orgs
 *   { action: "officer", org_id, user_id, status: approved|rejected|revoked }
 *   { action: "org_status", org_id, status: unclaimed|claimed|hidden }
 *   { action: "resolve_report", report_id }
 *   { action: "raised", report_id, verify: boolean }   (Chapter Cup, migration 093)
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = (k: string) => (typeof body[k] === "string" && UUID_RE.test(body[k] as string) ? (body[k] as string) : null);

  switch (body.action) {
    case "officer": {
      const org = id("org_id"), user = id("user_id");
      if (!org || !user || !["approved", "rejected", "revoked"].includes(body.status as string)) break;
      return callAdminRpc("admin_org_set_officer", { p_org: org, p_user: user, p_status: body.status });
    }
    case "org_status": {
      const org = id("org_id");
      if (!org || !["unclaimed", "claimed", "hidden"].includes(body.status as string)) break;
      return callAdminRpc("admin_org_set_status", { p_org: org, p_status: body.status });
    }
    case "raised": {
      const report = id("report_id");
      if (!report || typeof body.verify !== "boolean") break;
      return callAdminRpc("admin_org_raised_review", { p_id: report, p_verify: body.verify });
    }
    case "resolve_report": {
      const report = id("report_id");
      if (!report) break;
      return callAdminRpc("admin_org_resolve_report", { p_report: report });
    }
  }
  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
