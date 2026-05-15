/**
 * GA4 Data API reader — server-only.
 *
 * Auth: a Google Cloud service account JSON, base64-encoded in the env var
 *   GA4_SERVICE_ACCOUNT_JSON_B64
 * with the service account email granted "Viewer" on the GA4 property:
 *   GA4_PROPERTY_ID="123456789"
 *
 * No npm deps — we sign a JWT with RS256 via node:crypto and exchange it
 * for an OAuth access token, then call the runReport REST endpoint.
 *
 * If env is missing or auth fails, the helper returns { configured: false } so
 * the admin dashboard can render a setup card instead of crashing.
 */
import crypto from "node:crypto";

export type GA4Configured = { configured: true };
export type GA4NotConfigured = { configured: false; reason: string };

export type DailyEventRow = { day: string; count: number };

let _cachedToken: { token: string; expiresAt: number } | null = null;

function readServiceAccount() {
  const b64 = process.env.GA4_SERVICE_ACCOUNT_JSON_B64;
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as {
      client_email: string;
      private_key: string;
      token_uri: string;
    };
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && _cachedToken.expiresAt > now + 30) return _cachedToken.token;

  const sa = readServiceAccount();
  if (!sa) return null;

  // Build JWT: header.payload.signature (RS256)
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  let signature: string;
  try {
    signature = signer.sign(sa.private_key).toString("base64url");
  } catch (e) {
    console.error("[ga4.jwt] sign failed", e);
    return null;
  }
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error("[ga4.token] exchange failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const { access_token, expires_in } = (await res.json()) as {
    access_token: string; expires_in: number;
  };
  _cachedToken = { token: access_token, expiresAt: now + (expires_in || 3600) };
  return access_token;
}

/**
 * Returns the count of a given GA4 event per day for the last N days.
 * If GA4 isn't configured (env vars missing or auth fails), returns null —
 * caller renders a setup card.
 */
export async function getDailyEventCounts(
  eventName: string,
  days = 14,
): Promise<DailyEventRow[] | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return null;

  const token = await getAccessToken();
  if (!token) return null;

  try {
    const body = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: eventName },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: "100",
    };
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[ga4.report] failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const j = (await res.json()) as {
      rows?: Array<{ dimensionValues: { value: string }[]; metricValues: { value: string }[] }>;
    };
    return (j.rows || []).map((row) => ({
      day: row.dimensionValues[0]?.value || "",   // YYYYMMDD
      count: Number(row.metricValues[0]?.value || 0),
    }));
  } catch (e) {
    console.error("[ga4.report] threw", e);
    return null;
  }
}

export function isGA4Configured(): GA4Configured | GA4NotConfigured {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const hasSa = !!process.env.GA4_SERVICE_ACCOUNT_JSON_B64;
  if (!propertyId) return { configured: false, reason: "GA4_PROPERTY_ID not set" };
  if (!hasSa) return { configured: false, reason: "GA4_SERVICE_ACCOUNT_JSON_B64 not set" };
  return { configured: true };
}

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
