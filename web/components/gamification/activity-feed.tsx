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

type DiscoverableProfile = {
  display_name: string | null;
  avatar_url: string | null;
  is_discoverable: boolean | null;
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
          const discoverableProfile = profile as DiscoverableProfile | null;
          if (discoverableProfile?.is_discoverable === false) return;
          const next: ActivityRow = {
            id: ev.id,
            user_id: ev.user_id,
            source: ev.source,
            points: ev.xp_awarded,
            context: ev.context,
            created_at: ev.created_at,
            display_name: discoverableProfile?.display_name ?? "Someone",
            avatar_url: discoverableProfile?.avatar_url ?? null,
          };
          setRows((r) => [next, ...r].slice(0, 30));
        },
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.li
            key={r.id}
            layout
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass rounded-2xl px-3 py-2.5 flex items-center gap-3 hover:bg-amber/10 transition-colors"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber/10 text-xl select-none ring-1 ring-amber/10">
              {ICON[r.source] ?? "✨"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-medium text-mist">{r.display_name}</span>
                <span className="text-mist/60"> {VERB[r.source] ?? r.source}</span>
              </p>
              <p className="text-xs text-mist/40">{formatRelative(r.created_at)}</p>
            </div>
            <span className="text-xs font-bold text-amber tabular-nums">
              +{r.points}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
      {rows.length === 0 && (
        <li className="glass rounded-xl px-4 py-6 text-center text-sm text-mist/50">
          The lagoon is quiet… be the first to make a wave.
        </li>
      )}
    </ul>
  );
}
