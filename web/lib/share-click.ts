import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCode, sanitizeKind } from "@/lib/share";

const BOT_RE = /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|twitterbot|whatsapp|linkedin|pinterest|telegram|snapchat|imessage|applebot/i;

/**
 * Logs a click on a content share link into `referral_clicks`, the table the
 * `/r/` route writes, so the dashboard's share funnel sees these too.
 * `r` is the sharer's referral code (optional), `s` the share kind.
 * Best-effort: never throws, never blocks the page.
 */
export async function logShareClick(path: string, r?: string, s?: string): Promise<void> {
  try {
    const h = await headers();
    const ua = h.get("user-agent") || null;
    const code = sanitizeCode(r);
    const kind = sanitizeKind(s);
    const supa = await createClient();
    await supa.from("referral_clicks").insert({
      referral_code: code || "content",
      user_agent: ua,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      country: h.get("x-vercel-ip-country") || null,
      is_bot: BOT_RE.test(ua || ""),
      page_path: kind ? `${path}?s=${kind}` : path,
    });
  } catch (e) {
    console.warn("[share] click log failed", e);
  }
}
