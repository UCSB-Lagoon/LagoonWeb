/**
 * Hand-written subset of the live schema. Run `npm run db:types` once you have
 * the Supabase CLI linked to overwrite this with the canonical generated types.
 *
 * Only includes tables/views the web app touches.
 */
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          major_code: string | null;
          class_level: string | null;
          is_discoverable: boolean;
          show_gamification_surfaces: boolean;
          show_badge_showcase_on_profile: boolean;
          referral_code: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]> & {
          id: string;
          email: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
        Relationships: [];
      };
      user_gamification_profiles: {
        Row: {
          user_id: string;
          xp_total: number;
          level: number;
          streak_days: number;
          last_check_in_at: string | null;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_gamification_profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_gamification_profiles"]["Row"]>;
        Relationships: [];
      };
      user_xp_events: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          requested_xp: number;
          xp_awarded: number;
          context: string | null;
          day_key: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_xp_events"]["Row"]> & {
          user_id: string;
          source: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_xp_events"]["Row"]>;
        Relationships: [];
      };
      badge_catalog: {
        Row: {
          badge_id: string;
          title: string;
          description: string;
          category: string;
          rarity: string;
          icon: string;
          target_value: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["badge_catalog"]["Row"];
        Update: Partial<Database["public"]["Tables"]["badge_catalog"]["Row"]>;
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_badges"]["Row"]> & {
          user_id: string;
          badge_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Row"]>;
        Relationships: [];
      };
      weekly_challenges: {
        Row: {
          id: number;
          week_start: string;
          slug: string;
          title: string;
          description: string;
          target_source: string;
          target_count: number;
          xp_reward: number;
        };
        Insert: Omit<Database["public"]["Tables"]["weekly_challenges"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["weekly_challenges"]["Row"]>;
        Relationships: [];
      };
      leaderboard_weekly: {
        Row: { week_start: string; user_id: string; xp: number; rank: number };
        Insert: Database["public"]["Tables"]["leaderboard_weekly"]["Row"];
        Update: Partial<Database["public"]["Tables"]["leaderboard_weekly"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          points: number;
          context: string | null;
          created_at: string;
          display_name: string;
          avatar_url: string | null;
        };
      };
    };
    Functions: {
      refresh_leaderboard_weekly: { Args: Record<string, never>; Returns: void };
      get_visible_user_locations: {
        Args: { within_minutes?: number };
        Returns: {
          user_id: string | null;
          is_friend: boolean;
          is_self: boolean;
          latitude: number;
          longitude: number;
          horizontal_accuracy_m: number | null;
          status_emoji: string | null;
          status_text: string | null;
          updated_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};
