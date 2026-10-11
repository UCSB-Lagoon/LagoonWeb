import { createClient as createSupabase } from "@supabase/supabase-js";

/**
 * Chapters and their events for people without the app — migration 092 in
 * the iOS repo (`public_org_card`, `public_org_event_card`). An officer's
 * "Invite your chapter" link and a shared event both land here, in a group
 * chat or an Instagram bio, before anything asks for an install.
 *
 * What these return is what any signed-in student sees, minus everything
 * personal: no names, no friends, no house location, and an event at a
 * private house is only its block until someone RSVPs in the app.
 */

export type PublicOrgEvent = {
  id: string;
  org_slug: string;
  org_name: string;
  org_letters: string | null;
  title: string;
  description: string | null;
  category: string;
  starts_at: string;
  ends_at: string;
  venue_kind: string;
  venue_label: string;
  is_approximate: boolean;
  capacity: number | null;
  rsvp_count: number;
};

export type PublicOrg = {
  slug: string;
  kind: "chapter" | "club";
  name: string;
  full_name: string | null;
  letters: string | null;
  council: "ifc" | "panhellenic" | "usfc" | "nphc" | "pfc" | null;
  is_claimed: boolean;
  about: string | null;
  philanthropy: string | null;
  philanthropy_url: string | null;
  recruitment_note: string | null;
  instagram: string | null;
  website: string | null;
  member_count: number | null;
  upcoming_events: PublicOrgEvent[];
};

const SLUG = /^[a-z0-9-]{2,48}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function anon() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Dev-only fixtures, like lib/share.ts: `demo-chapter` and event `demo` never
// resolve in a production build.
const DEV = process.env.NODE_ENV !== "production";

function demoEvents(): PublicOrgEvent[] {
  const at = (days: number, hour: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    d.setUTCHours(hour + 7, 0, 0, 0); // Pacific daylight
    return d.toISOString();
  };
  const base = { org_slug: "demo-chapter", org_name: "Kappa Sigma", org_letters: "ΚΣ", capacity: null, description: null };
  return [
    { ...base, id: "demo", title: "Winter rush info night", category: "recruitment", starts_at: at(2, 19), ends_at: at(2, 21),
      venue_kind: "building", venue_label: "Girvetz Hall 1004", is_approximate: false, rsvp_count: 41,
      description: "Meet the chapter, hear how winter recruitment works, and ask anything. Pizza after." },
    { ...base, id: "demo-2", title: "Recruitment BBQ", category: "recruitment", starts_at: at(4, 17), ends_at: at(4, 19),
      venue_kind: "house", venue_label: "6500 block of Del Playa", is_approximate: true, rsvp_count: 63 },
    { ...base, id: "demo-3", title: "Beach cleanup for Surfrider", category: "philanthropy", starts_at: at(9, 10), ends_at: at(9, 12),
      venue_kind: "outdoor", venue_label: "Goleta Beach", is_approximate: false, rsvp_count: 18 },
  ];
}

const DEMO_ORG = (): PublicOrg => ({
  slug: "demo-chapter",
  kind: "chapter",
  name: "Kappa Sigma",
  full_name: "Kappa Sigma Fraternity",
  letters: "ΚΣ",
  council: "ifc",
  is_claimed: true,
  about: "Kappa Sigma at UCSB since 1948. Brotherhood, scholarship and service.",
  philanthropy: "Military Heroes Campaign",
  philanthropy_url: "https://www.kappasigma.org",
  recruitment_note: "Winter recruitment runs the second week of the quarter. Come to an info night, no sign-up needed.",
  instagram: "ucsbkappasig",
  website: null,
  member_count: 74,
  upcoming_events: demoEvents(),
});

export async function fetchPublicOrg(rawSlug: string): Promise<PublicOrg | null> {
  const slug = (rawSlug || "").toLowerCase();
  if (DEV && slug === "demo-chapter") return DEMO_ORG();
  if (!SLUG.test(slug)) return null;
  const { data, error } = await anon().rpc("public_org_card", { p_slug: slug });
  if (error) {
    console.warn("[org] public_org_card failed", error.message);
    return null;
  }
  return (data as PublicOrg | null) ?? null;
}

export async function fetchPublicOrgEvent(id: string): Promise<PublicOrgEvent | null> {
  if (DEV && id.startsWith("demo")) return demoEvents().find((e) => e.id === id) ?? null;
  if (!UUID.test(id)) return null;
  const { data, error } = await anon().rpc("public_org_event_card", { p_id: id.toLowerCase() });
  if (error) {
    console.warn("[event] public_org_event_card failed", error.message);
    return null;
  }
  return (data as PublicOrgEvent | null) ?? null;
}

// ── Words (the app's, in OrgCouncil / OrgEventCategory / OrgEvent) ────────

export const councilTitle = (c: PublicOrg["council"]) =>
  c
    ? {
        ifc: "Interfraternity Council",
        panhellenic: "Panhellenic",
        usfc: "United Sorority & Fraternity Council",
        nphc: "National Pan-Hellenic Council",
        pfc: "Professional Fraternity Council",
      }[c]
    : "Club";

export const councilShort = (c: PublicOrg["council"]) =>
  c ? { ifc: "IFC", panhellenic: "Panhellenic", usfc: "USFC", nphc: "NPHC", pfc: "Professional" }[c] : "Club";

export const categoryTitle = (c: string) =>
  ({
    recruitment: "Recruitment",
    philanthropy: "Philanthropy",
    info_session: "Info session",
    meeting: "Meeting",
    performance: "Performance",
    sports: "Sports",
    study: "Study",
  })[c] ?? "Event";

export const hostLabel = (e: Pick<PublicOrgEvent, "org_letters" | "org_name">) =>
  e.org_letters ? `${e.org_letters} · ${e.org_name}` : e.org_name;

const TZ = "America/Los_Angeles";
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts });
const DAY = fmt({ weekday: "short", month: "short", day: "numeric" });
const TIME = fmt({ hour: "numeric", minute: "2-digit" });
const MONTH = fmt({ month: "short" });
const DATE = fmt({ day: "numeric" });

/** "7:00 PM" → "7 PM"; keeps "7:30 PM". */
const short = (d: Date) => TIME.format(d).replace(":00", "");

/** "Thu, Oct 15 · 7 – 9 PM", in campus time. */
export function whenLine(e: Pick<PublicOrgEvent, "starts_at" | "ends_at">): string {
  const s = new Date(e.starts_at);
  const end = new Date(e.ends_at);
  const sameHalf = TIME.format(s).slice(-2) === TIME.format(end).slice(-2);
  const start = sameHalf ? short(s).replace(/ [AP]M$/, "") : short(s);
  return `${DAY.format(s)} · ${start} – ${short(end)}`;
}

export const datePlate = (iso: string) => ({ month: MONTH.format(new Date(iso)), day: DATE.format(new Date(iso)) });

export const hasEnded = (e: Pick<PublicOrgEvent, "ends_at">) => new Date(e.ends_at).getTime() < Date.now();

export const goingLine = (e: Pick<PublicOrgEvent, "rsvp_count" | "capacity">) => {
  if (e.rsvp_count === 0 && !e.capacity) return null;
  const going = `${e.rsvp_count} going`;
  return e.capacity ? `${going} · ${e.capacity} spots` : going;
};

// ── Chapter Cup (iOS migration 093, `public_chapter_cup`) ─────────────────

export type CupRow = {
  slug: string;
  name: string;
  letters: string | null;
  council: PublicOrg["council"];
  /** Members on Lagoon; null below five. */
  members: number | null;
  turnout: number;
  raised_cents: number;
};
export type PublicCup = { season: { name: string; starts_on: string } | null; rows: CupRow[] };
export type CupBoard = "members" | "turnout" | "raised";

const DEMO_CUP: PublicCup = {
  season: { name: "Fall 2026", starts_on: "2026-09-24" },
  rows: [
    { slug: "alpha-chi-omega", name: "Alpha Chi Omega", letters: "ΑΧΩ", council: "panhellenic", members: 96, turnout: 158, raised_cents: 893500 },
    { slug: "delta-gamma", name: "Delta Gamma", letters: "ΔΓ", council: "panhellenic", members: 81, turnout: 140, raised_cents: 0 },
    { slug: "kappa-sigma", name: "Kappa Sigma", letters: "ΚΣ", council: "ifc", members: 74, turnout: 212, raised_cents: 412000 },
    { slug: "sigma-chi", name: "Sigma Chi", letters: "ΣΧ", council: "ifc", members: 52, turnout: 96, raised_cents: 215000 },
    { slug: "alpha-kappa-psi", name: "Alpha Kappa Psi", letters: "ΑΚΨ", council: "pfc", members: 38, turnout: 75, raised_cents: 0 },
    { slug: "lambda-theta-alpha", name: "Lambda Theta Alpha", letters: "ΛΘΑ", council: "usfc", members: 12, turnout: 41, raised_cents: 60000 },
  ],
};

export async function fetchPublicCup(demo = false): Promise<PublicCup> {
  if (DEV && demo) return DEMO_CUP;
  try {
    const { data, error } = await anon().rpc("public_chapter_cup");
    if (error) throw error;
    return (data as PublicCup | null) ?? { season: null, rows: [] };
  } catch (error) {
    console.warn("[cup] public_chapter_cup failed", error instanceof Error ? error.message : error);
    return { season: null, rows: [] };
  }
}

export function standings(cup: PublicCup, board: CupBoard): { rank: number; row: CupRow; value: number }[] {
  const value = (r: CupRow) => (board === "members" ? r.members : board === "turnout" ? r.turnout || null : r.raised_cents || null);
  const scored = cup.rows
    .map((row) => ({ row, value: value(row) }))
    .filter((x): x is { row: CupRow; value: number } => x.value !== null && x.value > 0)
    .sort((a, b) => (b.value - a.value) || a.row.name.localeCompare(b.row.name));
  const out: { rank: number; row: CupRow; value: number }[] = [];
  scored.forEach((x, i) => {
    const rank = i > 0 && scored[i - 1].value === x.value ? out[i - 1].rank : i + 1;
    out.push({ rank, ...x });
  });
  return out;
}

export function formatCup(value: number, board: CupBoard): string {
  if (board !== "raised") return String(value);
  const dollars = value / 100;
  return dollars >= 1000 ? `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k` : `$${Math.round(dollars)}`;
}
