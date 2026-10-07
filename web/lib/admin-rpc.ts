import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

/**
 * Shared by /api/admin/orgs and /api/admin/events: checks the signed-in
 * user is on ADMIN_EMAILS, then runs one service-role RPC (migrations
 * 089/090 grant the admin_org_* functions to service_role only).
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function callAdminRpc(fn: string, args: Record<string, unknown>): Promise<NextResponse> {
  const admin = createAdminClient();
  const { error } = await admin.rpc(fn as never, args as never);
  if (error) {
    console.error(`[admin.${fn}]`, error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
