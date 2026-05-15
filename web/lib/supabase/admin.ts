import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client that bypasses RLS via the service role key.
 *
 * NEVER import this from a Client Component or pass anything from it through
 * to the browser. Use only inside Route Handlers, Server Actions, and Server
 * Components on admin-gated routes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set for admin operations.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Comma-separated list of admin emails, set via ADMIN_EMAILS env var.
 * Example: ADMIN_EMAILS="dev@soapboxsuperapp.com,founder@lagoonucsb.com"
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
