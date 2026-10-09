import { createClient as createSupabase } from "@supabase/supabase-js";

/**
 * Shared weeks (/w/{id}) and "When are we free?" groups (/f/{id}) —
 * migration 091 in the iOS repo. Both are read without a session through
 * SECURITY DEFINER functions that take the link's token; the tables
 * themselves aren't readable by anon.
 *
 * Why these pages exist: a link shared from the app used to 302 straight to
 * the App Store, so the friend who tapped "here's my week, when are we
 * free?" never saw the week. These show the thing first, then the install.
 */

export const DAY_CODES = ["M", "T", "W", "R", "F"] as const;
export type DayCode = (typeof DAY_CODES)[number];

export type FreeGroupWindow = { d: DayCode; s: number; e: number };
export type FreeGroupMember = { name: string; is_me: boolean | null; has_schedule: boolean };
export type FreeGroup = {
  id: string;
  title: string | null;
  created_by_name: string;
  is_member: boolean;
  scheduled_count: number;
  members: FreeGroupMember[];
  slot_start: number;
  slot_minutes: number;
  slots: Partial<Record<DayCode, number[]>>;
  best: FreeGroupWindow[];
};

export type SharedWeekBlock = { d: DayCode; s: number; e: number; c: string; h: string; l: string };
export type SharedWeek = {
  id: string;
  kind: "week" | "plan";
  quarter: string | null;
  quarter_name: string | null;
  owner_name: string;
  blocks: SharedWeekBlock[];
};

const TOKEN = /^[A-Za-z0-9_-]{10}$/;

/** Anon, no cookies, no generated types (these RPCs aren't in them yet). */
function anon() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Dev-only fixtures so the pages can be designed without writing to the
// production database. `demo000000` never resolves in a production build.
const DEV = process.env.NODE_ENV !== "production";

function demoSlots(): Partial<Record<DayCode, number[]>> {
  const day = (busy: [number, number, number][]) =>
    Array.from({ length: 48 }, (_, i) => {
      const s = 480 + i * 15;
      return Math.max(0, 3 - busy.filter(([a, b]) => a <= s && s < b).reduce((n, [, , k]) => n + k, 0));
    });
  return {
    M: day([[540, 600, 2], [720, 825, 1], [900, 975, 3]]),
    T: day([[570, 645, 2], [660, 735, 1], [840, 915, 2]]),
    W: day([[540, 600, 2], [720, 825, 1], [900, 975, 3]]),
    R: day([[570, 645, 2], [660, 735, 1], [840, 915, 2]]),
    F: day([[540, 600, 1], [660, 735, 2]]),
  };
}

const DEMO_GROUP: FreeGroup = {
  id: "demo000000",
  title: "Anacapa 3rd floor",
  created_by_name: "Maya C.",
  is_member: false,
  scheduled_count: 3,
  members: [
    { name: "Maya C.", is_me: null, has_schedule: true },
    { name: "Sam O.", is_me: null, has_schedule: true },
    { name: "Priya N.", is_me: null, has_schedule: true },
    { name: "Jordan A.", is_me: null, has_schedule: false },
  ],
  slot_start: 480,
  slot_minutes: 15,
  slots: demoSlots(),
  best: [
    { d: "F", s: 735, e: 1200 },
    { d: "T", s: 915, e: 1200 },
    { d: "R", s: 915, e: 1200 },
    { d: "T", s: 735, e: 840 },
  ],
};

const DEMO_WEEK: SharedWeek = {
  id: "demo000000",
  kind: "plan",
  quarter: "20271",
  quarter_name: "Winter 2027",
  owner_name: "Maya C.",
  blocks: [
    { d: "M", s: 840, e: 915, c: "PSTAT 120A", h: "86CBB6", l: "Theater and Dance West" },
    { d: "W", s: 840, e: 915, c: "PSTAT 120A", h: "86CBB6", l: "Theater and Dance West" },
    { d: "T", s: 660, e: 735, c: "ECON 10A", h: "EFDC7B", l: "Broida" },
    { d: "R", s: 660, e: 735, c: "ECON 10A", h: "EFDC7B", l: "Broida" },
    { d: "F", s: 540, e: 590, c: "ECON 10A", h: "EFDC7B", l: "Girvetz" },
    { d: "T", s: 780, e: 855, c: "WRIT 105PS", h: "E9A196", l: "South Hall" },
    { d: "R", s: 780, e: 855, c: "WRIT 105PS", h: "E9A196", l: "South Hall" },
    { d: "M", s: 600, e: 650, c: "EARTH 4", h: "B2A2E0", l: "Campbell Hall" },
    { d: "W", s: 600, e: 650, c: "EARTH 4", h: "B2A2E0", l: "Campbell Hall" },
  ],
};

export async function fetchFreeGroup(id: string): Promise<FreeGroup | null> {
  if (DEV && id === "demo000000") return DEMO_GROUP;
  if (!TOKEN.test(id)) return null;
  const { data, error } = await anon().rpc("free_group_view", { p_id: id });
  if (error) {
    console.warn("[f] free_group_view failed", error.message);
    return null;
  }
  return (data as FreeGroup | null) ?? null;
}

export async function fetchSharedWeek(id: string): Promise<SharedWeek | null> {
  if (DEV && id === "demo000000") return DEMO_WEEK;
  if (!TOKEN.test(id)) return null;
  const { data, error } = await anon().rpc("get_shared_week", { p_id: id });
  if (error) {
    console.warn("[w] get_shared_week failed", error.message);
    return null;
  }
  return (data as SharedWeek | null) ?? null;
}

// ── Words ────────────────────────────────────────────────────────────────

export const dayName = (d: string) => ({ M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri" })[d] ?? d;
export const longDayName = (d: string) =>
  ({ M: "Monday", T: "Tuesday", W: "Wednesday", R: "Thursday", F: "Friday" })[d] ?? d;

/** 735 → "12:15 PM"; with `bare`, no AM/PM. */
export function clock(minute: number, bare = false): string {
  const h24 = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const t = `${h12}:${String(m).padStart(2, "0")}`;
  return bare ? t : `${t} ${h24 < 12 ? "AM" : "PM"}`;
}

/** "12:15 – 8:00 PM", or "11:00 AM – 3:00 PM" across noon. Same as the app. */
export function range(s: number, e: number): string {
  const sameHalf = s < 720 === e < 720;
  return `${sameHalf ? clock(s, true) : clock(s)} – ${clock(e)}`;
}

export const isWholeDay = (w: FreeGroupWindow, g: Pick<FreeGroup, "slot_start" | "slot_minutes">) =>
  w.s <= g.slot_start && w.e >= g.slot_start + 48 * g.slot_minutes;

export function headline(g: FreeGroup): { lead: string; mark?: string } {
  if (g.scheduled_count < 2) return { lead: "Waiting on friends." };
  const first = g.best[0];
  if (!first) return { lead: "No time when everyone's free." };
  return isWholeDay(first, g)
    ? { lead: "Everyone's free", mark: longDayName(first.d) }
    : { lead: "Everyone's free", mark: `${dayName(first.d)} ${range(first.s, first.e)}` };
}

export function membersLine(g: FreeGroup): string {
  const names = g.members.map((m) => m.name);
  const shown =
    names.length === 0
      ? "No one yet"
      : names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  const waiting = g.members.filter((m) => !m.has_schedule).length;
  return waiting ? `${shown} · ${waiting} still adding classes` : shown;
}

/** Course codes in the order they first meet, for descriptions. */
export function courseList(w: SharedWeek, max = 4): string {
  const seen: string[] = [];
  for (const b of [...w.blocks].sort((a, b) => DAY_CODES.indexOf(a.d) - DAY_CODES.indexOf(b.d) || a.s - b.s)) {
    if (b.c && !seen.includes(b.c)) seen.push(b.c);
  }
  return seen.length > max ? `${seen.slice(0, max).join(", ")} +${seen.length - max}` : seen.join(", ");
}

// ── Install ──────────────────────────────────────────────────────────────

export const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

/** Tagged so App Store Connect → Campaigns counts installs per share kind. */
export function appStoreURL(kind: string): string {
  const pt = process.env.NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN;
  if (!pt) return APP_STORE;
  const url = new URL(APP_STORE);
  url.searchParams.set("pt", pt);
  url.searchParams.set("ct", `share-${kind}`.slice(0, 40));
  url.searchParams.set("mt", "8");
  return url.toString();
}

export const sanitizeKind = (raw: string | undefined) =>
  (raw || "").toLowerCase().replace(/[^a-z_]/g, "").slice(0, 24);
export const sanitizeCode = (raw: string | undefined) =>
  (raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);

/** App brand, pinned for images (same hexes as the app's share cards). */
export const BRAND = {
  navy: "#001E30",
  raised: "#00304C",
  cream: "#F4F1EA",
  gold: "#EFDC7B",
  teal: "#86CBB6",
  coral: "#E9A196",
  violet: "#B2A2E0",
};
