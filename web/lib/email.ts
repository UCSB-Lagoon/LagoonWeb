/**
 * Resend transactional email helper.
 *
 * Direct REST call so we don't add a runtime dependency. Server-only.
 *
 * Configure via env:
 *   RESEND_API_KEY            — server-only, never expose to the client
 *   RESEND_FROM               — e.g. "Lagoon <team@lagoonucsb.com>" (must be a verified Resend sender)
 *
 * If RESEND_API_KEY is missing, sendEmail() logs and returns { ok: false, skipped: true }
 * so the rest of the workflow (e.g. captain accept) continues without crashing.
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Record<string, string>;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Lagoon <team@lagoonucsb.com>";

  if (!apiKey) {
    console.warn("[email.send] RESEND_API_KEY not set — skipping send", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: false, skipped: true, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.tags
          ? { tags: Object.entries(input.tags).map(([name, value]) => ({ name, value })) }
          : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email.send] Resend error", res.status, body);
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const j = (await res.json()) as { id?: string };
    return { ok: true, id: j.id || "" };
  } catch (e) {
    console.error("[email.send] fetch failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Template: captain acceptance
// ────────────────────────────────────────────────────────────────────────────

export function captainAcceptedEmail(args: {
  name: string;
  code: string;
}): { subject: string; html: string; text: string } {
  const firstName = args.name.split(/\s+/)[0] || "Captain";
  const link = `https://app.lagoonucsb.com/r/${args.code}`;
  const subject = `${firstName} — you're in. Here's your Lagoon captain link.`;
  const text = `Welcome to the Lagoon captain crew, ${firstName}.

Your personal referral link:
${link}

Every install through that link is yours. We'll ship your hoodie + first batch of share assets this week.

Quick start:
1. Add the link to your IG bio (or wherever feels natural).
2. We'll DM you the share-asset pack within 48h.
3. Top 3 referrers each quarter get a $50 Apple gift card on top of the hoodie + dinners.

Reply to this email if you have questions — we read every one ourselves.

— Lagoon team
https://lagoonucsb.com`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#FBF7F0;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,system-ui,Segoe UI,sans-serif;color:#1e1410;line-height:1.5">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="600" style="max-width:600px;margin:0 auto;padding:32px 24px">
  <tr><td>
    <div style="display:inline-block;padding:6px 14px;border-radius:9999px;background:#FFE6D1;color:#B95B22;font-size:11px;letter-spacing:.18em;font-weight:700;text-transform:uppercase">You're in</div>
    <h1 style="font-size:36px;line-height:1.05;margin:18px 0 8px;font-weight:800;letter-spacing:-.03em">
      Welcome to the crew, ${escapeHtml(firstName)}.
    </h1>
    <p style="font-size:17px;color:#6b5b4a;margin:0 0 28px">
      You're officially a Lagoon captain at UCSB. Here's your personal referral link — every install through it is yours.
    </p>

    <div style="background:#FFFCF7;border:1px solid #E2D2BF;border-radius:18px;padding:24px;text-align:center">
      <div style="font-size:11px;letter-spacing:.18em;color:#8c7a66;text-transform:uppercase;font-weight:700;margin-bottom:8px">Your captain link</div>
      <div style="font-family:'Space Mono',ui-monospace,SFMono-Regular,monospace;font-size:18px;font-weight:700;color:#1e1410;word-break:break-all">
        ${escapeHtml(link)}
      </div>
      <a href="${escapeHtml(link)}" style="display:inline-block;margin-top:18px;background:#F08A3C;color:white;font-weight:700;padding:14px 26px;border-radius:9999px;text-decoration:none;font-size:15px">
        Test your link
      </a>
    </div>

    <h2 style="font-size:20px;margin:36px 0 12px;font-weight:700">Next steps</h2>
    <ol style="padding-left:20px;color:#2a1a0f;font-size:15px">
      <li style="margin-bottom:8px"><strong>Drop the link in your IG bio</strong> (or wherever feels natural — no quotas, no posting requirements).</li>
      <li style="margin-bottom:8px"><strong>We'll DM you the share-asset pack</strong> within 48h: short clips, screenshots, suggested captions.</li>
      <li style="margin-bottom:8px"><strong>Hoodie ships this week</strong>. We'll confirm your size/shipping address in the DM.</li>
      <li style="margin-bottom:8px"><strong>Top 3 captains each quarter</strong> get a $50 Apple gift card on top of the hoodie + dinners.</li>
    </ol>

    <p style="font-size:14px;color:#6b5b4a;margin-top:28px">
      Questions? Just reply — we read every email ourselves.
    </p>
    <p style="font-size:13px;color:#8c7a66;margin-top:24px;border-top:1px solid #ead9bf;padding-top:18px">
      — The Lagoon team<br>
      <a href="https://lagoonucsb.com" style="color:#C8754C">lagoonucsb.com</a>
    </p>
  </td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}
