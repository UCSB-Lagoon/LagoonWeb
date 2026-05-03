"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ActivityRow = {
  id: string;
  user_id: string;
  source: string;
  points: number;
  context: string | null;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
};

const ICON: Record<string, string> = {
  daily_check_in:   "🌅",
  planner_progress: "📅",
  schedule_add:     "🗓️",
  class_vibe:       "📊",
  friend_request:   "👋",
  friend_accept:    "🤝",
  referral:         "🤝",
  badge_earned:     "🏅",
};

const VERB: Record<string, string> = {
  daily_check_in:   "checked in for the day",
  planner_progress: "made planner progress",
  schedule_add:     "updated their schedule",
  class_vibe:       "dropped a class vibe",
  friend_request:   "sent a friend request",
  friend_accept:    "made a new friend",
  referral:         "brought a friend to Lagoon",
  badge_earned:     "earned a badge",
};

export function ActivityFeed({ initial }: { initial: ActivityRow[] }) {
  const [rows, setRows] = useState<ActivityRow[]>(initial);

  useEffect(() => {
    const sb = createClient() as any;
    const channel = sb
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_xp_events" },
        async (payload: { new: unknown }) => {
          const ev = payload.new as {
            id: string; user_id: string; source: string;
            xp_awarded: number; context: string | null; created_at: string;
          };
          const { data: profile } = await sb
            .from("user_profiles")
            .select("display_name, avatar_url, is_discoverable")
            .eq("id", ev.user_id)
            .single();
          if (profile?.is_discoverable === false) return;
          setRows((r) =>
            [{
              id: ev.id, user_id: ev.user_id, source: ev.source,
              points: ev.xp_awarded, context: ev.context, created_at: ev.created_at,
              display_name: profile?.display_name ?? "Someone",
              avatar_url: profile?.avatar_url ?? null,
            }, ...r].slice(0, 30),
          );
        },
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.li
            key={r.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100/70 transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 border border-orange-200 text-base">
              {ICON[r.source] ?? "✨"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-semibold text-ink-900">{r.display_name}</span>
                <span className="text-ink-500"> {VERB[r.source] ?? r.source}</span>
              </p>
              <p className="text-xs text-ink-400">{formatRelative(r.created_at)}</p>
            </div>
            <span className="text-xs font-bold text-orange-600 tabular-nums">+{r.points}</span>
          </motion.li>
        ))}
      </AnimatePresence>
      {rows.length === 0 && (
        <li className="rounded-xl px-4 py-6 text-center text-sm text-ink-400 border border-dashed border-cream-200">
          The lagoon is quiet… be the first to make a wave.
        </li>
      )}
    </ul>
  );
}
