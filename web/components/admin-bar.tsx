import Link from "next/link";
import { Shield, Inbox, Trophy, BarChart3, ExternalLink, Sparkles, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

/**
 * <AdminBar /> — thin operational bar that renders ONLY when the current
 * session belongs to an admin (email in ADMIN_EMAILS). Surfaces live signal
 * (pending captain apps, top referrer, total signups) and quick jumps so
 * admins get useful information just by loading any page.
 *
 * Server-rendered. Renders null for everyone else with zero network cost.
 *
 * Mounted globally in app/layout.tsx above <Navbar />.
 */
export async function AdminBar() {
  // ── Auth gate ────────────────────────────────────────────────────────────
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;

  // ── Pull operational signal in parallel (best-effort; tolerate failures) ─
  const admin = createAdminClient();
  async function safeCount(filter?: { status: string }): Promise<number> {
    try {
      const q = admin.from("captain_applications").select("id", { count: "exact", head: true });
      const res = filter ? await q.eq("status", filter.status) : await q;
      return res.count ?? 0;
    } catch { return 0; }
  }
  async function topReferral(): Promise<[string, number] | null> {
    try {
      const res = await admin
        .from("captain_applications")
        .select("referral_code")
        .not("referral_code", "is", null);
      const rows = (res.data as { referral_code: string | null }[] | null) || [];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        if (row.referral_code) counts[row.referral_code] = (counts[row.referral_code] || 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted[0] ?? null;
    } catch { return null; }
  }
  async function openFeedback(): Promise<number> {
    try {
      const res = await admin
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      return res.count ?? 0;
    } catch { return 0; }
  }
  const [newApps, totalApps, topRef, newFeedback] = await Promise.all([
    safeCount({ status: "new" }),
    safeCount(),
    topReferral(),
    openFeedback(),
  ]);

  return (
    <div className="relative z-50 bg-gradient-to-r from-ink-900 via-[#241208] to-ink-900 text-cream-50 border-b border-orange-500/30 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-5 h-11 flex items-center gap-3 text-xs">
        {/* Brand badge */}
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/15 text-orange-300 font-bold tracking-[0.18em] text-[10px] uppercase ring-1 ring-orange-500/30">
          <Shield className="w-3 h-3" /> Admin
        </span>

        {/* Inline live signal */}
        <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto whitespace-nowrap flex-1 scrollbar-none">
          <Stat
            href="/admin/captains?status=new"
            icon={Inbox}
            label="Pending apps"
            value={newApps}
            hot={newApps > 0}
          />
          <Stat
            href="/admin/captains"
            icon={Sparkles}
            label="Total apps"
            value={totalApps}
          />
          <Stat
            href="/admin/feedback?status=new"
            icon={MessageSquare}
            label="New feedback"
            value={newFeedback}
            hot={newFeedback > 0}
          />
          {topRef && (
            <Stat
              href={`/admin/captains?status=accepted`}
              icon={Trophy}
              label="Top captain"
              value={`${topRef[0]} · ${topRef[1]}`}
            />
          )}
        </div>

        {/* Right cluster — quick jumps */}
        <div className="hidden sm:flex items-center gap-2">
          <QuickLink href="/admin">Dashboard</QuickLink>
          <QuickLink href="/admin/captains">Captains</QuickLink>
          <QuickLink href="/admin/feedback">Feedback</QuickLink>
          <QuickLink href="/admin/handbook">Handbook</QuickLink>
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-cream-50/10 text-cream-50/80 hover:text-cream-50 transition"
          >
            <BarChart3 className="w-3 h-3" /> GA4 <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
          <span className="text-cream-50/30">·</span>
          <span className="font-mono text-cream-50/50 text-[11px] hidden md:inline">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  href, icon: Icon, label, value, hot,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition",
        "text-cream-50/85 hover:text-cream-50 hover:bg-cream-50/8",
        hot ? "ring-1 ring-orange-500/40" : "",
      ].join(" ")}
    >
      <Icon className={`w-3 h-3 ${hot ? "text-orange-300" : "text-cream-50/60"}`} />
      <span className="text-cream-50/60">{label}</span>
      <span className={`font-bold tabular-nums ${hot ? "text-orange-300" : "text-cream-50"}`}>
        {value}
      </span>
      {hot && (
        <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 animate-[pulse-soft_2s_ease-in-out_infinite]" aria-hidden />
      )}
    </Link>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-cream-50/10 text-cream-50/80 hover:text-cream-50 font-medium transition"
    >
      {children}
    </Link>
  );
}
