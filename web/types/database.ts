export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_scores: {
        Row: {
          attendance_pct: number | null
          bills_authored: number | null
          bills_passed: number | null
          calculated_at: string | null
          committee_score: number | null
          id: string
          official_id: string
          outreach_score: number | null
          promise_score: number | null
          total_score: number | null
        }
        Insert: {
          attendance_pct?: number | null
          bills_authored?: number | null
          bills_passed?: number | null
          calculated_at?: string | null
          committee_score?: number | null
          id?: string
          official_id: string
          outreach_score?: number | null
          promise_score?: number | null
          total_score?: number | null
        }
        Update: {
          attendance_pct?: number | null
          bills_authored?: number | null
          bills_passed?: number | null
          calculated_at?: string | null
          committee_score?: number | null
          id?: string
          official_id?: string
          outreach_score?: number | null
          promise_score?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "action_scores_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: true
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          app_version: string | null
          created_at: string
          event_name: string
          id: string
          properties: Json
          session_id: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          event_name: string
          id?: string
          properties?: Json
          session_id: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      badge_catalog: {
        Row: {
          badge_id: string
          category: string
          created_at: string
          description: string
          icon: string
          is_active: boolean
          rarity: string
          sort_order: number
          target_value: number
          title: string
        }
        Insert: {
          badge_id: string
          category: string
          created_at?: string
          description: string
          icon: string
          is_active?: boolean
          rarity: string
          sort_order?: number
          target_value?: number
          title: string
        }
        Update: {
          badge_id?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          is_active?: boolean
          rarity?: string
          sort_order?: number
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          author_id: string
          created_at: string | null
          description: string | null
          id: string
          introduced_at: string
          status: string
          title: string
          voted_at: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          introduced_at?: string
          status?: string
          title: string
          voted_at?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          introduced_at?: string
          status?: string
          title?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_events: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          image_url: string | null
          link: string | null
          location: string | null
          organizer: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          organizer?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          organizer?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campus_pulse_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          mood: string | null
          reaction_count: number
          report_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          mood?: string | null
          reaction_count?: number
          report_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          mood?: string | null
          reaction_count?: number
          report_count?: number
          user_id?: string
        }
        Relationships: []
      }
      campus_pulse_reactions: {
        Row: {
          created_at: string
          pulse_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pulse_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          pulse_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_pulse_reactions_pulse_id_fkey"
            columns: ["pulse_id"]
            isOneToOne: false
            referencedRelation: "campus_pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_pulse_reports: {
        Row: {
          created_at: string
          pulse_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          pulse_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          pulse_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_pulse_reports_pulse_id_fkey"
            columns: ["pulse_id"]
            isOneToOne: false
            referencedRelation: "campus_pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          bio: string | null
          created_at: string | null
          election_id: string
          id: string
          name: string
          party: string | null
          photo_url: string | null
          platform_summary: string | null
          position_sought: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          election_id: string
          id?: string
          name: string
          party?: string | null
          photo_url?: string | null
          platform_summary?: string | null
          position_sought: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          election_id?: string
          id?: string
          name?: string
          party?: string | null
          photo_url?: string | null
          platform_summary?: string | null
          position_sought?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      captain_applications: {
        Row: {
          email: string
          id: string
          instagram: string | null
          ip: string | null
          major: string | null
          name: string
          pitch: string
          referral_code: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string
          user_agent: string | null
          why: string | null
          year: string | null
        }
        Insert: {
          email: string
          id?: string
          instagram?: string | null
          ip?: string | null
          major?: string | null
          name: string
          pitch: string
          referral_code?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          user_agent?: string | null
          why?: string | null
          year?: string | null
        }
        Update: {
          email?: string
          id?: string
          instagram?: string | null
          ip?: string | null
          major?: string | null
          name?: string
          pitch?: string
          referral_code?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          user_agent?: string | null
          why?: string | null
          year?: string | null
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          challenge_id: number
          completed_at: string | null
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: number
          completed_at?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: number
          completed_at?: string | null
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      class_attendance_logs: {
        Row: {
          course_id: string
          id: string
          logged_at: string
          meeting_date: string
          meeting_type: string
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          logged_at?: string
          meeting_date: string
          meeting_type?: string
          status: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          logged_at?: string
          meeting_date?: string
          meeting_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      class_confession_reports: {
        Row: {
          confession_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          confession_id: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
        }
        Update: {
          confession_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_confession_reports_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "class_confessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_confession_votes: {
        Row: {
          confession_id: string
          created_at: string
          id: string
          updated_at: string
          vote: number
          voter_id: string
        }
        Insert: {
          confession_id: string
          created_at?: string
          id?: string
          updated_at?: string
          vote: number
          voter_id: string
        }
        Update: {
          confession_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          vote?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_confession_votes_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "class_confessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_confessions: {
        Row: {
          body: string
          course_key: string
          created_at: string
          id: string
          quarter_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          course_key: string
          created_at?: string
          id?: string
          quarter_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          course_key?: string
          created_at?: string
          id?: string
          quarter_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      class_vibes: {
        Row: {
          course_key: string
          created_at: string
          id: string
          quarter_code: string
          rating: string
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          course_key: string
          created_at?: string
          id?: string
          quarter_code: string
          rating: string
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          course_key?: string
          created_at?: string
          id?: string
          quarter_code?: string
          rating?: string
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      committee_memberships: {
        Row: {
          committee_name: string
          created_at: string | null
          id: string
          official_id: string
          role: string | null
        }
        Insert: {
          committee_name: string
          created_at?: string | null
          id?: string
          official_id: string
          role?: string | null
        }
        Update: {
          committee_name?: string
          created_at?: string | null
          id?: string
          official_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_memberships_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      constituent_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          official_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          official_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          official_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "constituent_events_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_grade_scenarios: {
        Row: {
          components: Json
          course_id: string
          created_at: string
          id: string
          projected_grade: string | null
          quarter: string
          required_remaining_score: number | null
          scenario_name: string
          target_grade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          components?: Json
          course_id: string
          created_at?: string
          id?: string
          projected_grade?: string | null
          quarter: string
          required_remaining_score?: number | null
          scenario_name?: string
          target_grade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          components?: Json
          course_id?: string
          created_at?: string
          id?: string
          projected_grade?: string | null
          quarter?: string
          required_remaining_score?: number | null
          scenario_name?: string
          target_grade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          instructor: string | null
          quarter: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          instructor?: string | null
          quarter: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          instructor?: string | null
          quarter?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_briefs: {
        Row: {
          body: string
          brief_date: string
          generated_at: string
          headline: string
          is_hidden: boolean
          kicker: string | null
          model: string
          source_event_ids: string[]
          source_news_ids: string[]
          source_pulse_ids: string[]
          updated_at: string
        }
        Insert: {
          body: string
          brief_date: string
          generated_at?: string
          headline: string
          is_hidden?: boolean
          kicker?: string | null
          model?: string
          source_event_ids?: string[]
          source_news_ids?: string[]
          source_pulse_ids?: string[]
          updated_at?: string
        }
        Update: {
          body?: string
          brief_date?: string
          generated_at?: string
          headline?: string
          is_hidden?: boolean
          kicker?: string | null
          model?: string
          source_event_ids?: string[]
          source_news_ids?: string[]
          source_pulse_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      election_pulse_candidate_totals: {
        Row: {
          candidate_key: string
          candidate_name: string
          election_slug: string
          race_key: string
          race_title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          candidate_key: string
          candidate_name: string
          election_slug: string
          race_key: string
          race_title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          candidate_key?: string
          candidate_name?: string
          election_slug?: string
          race_key?: string
          race_title?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: []
      }
      election_pulse_race_totals: {
        Row: {
          election_slug: string
          race_key: string
          race_title: string
          total_votes: number
          updated_at: string
        }
        Insert: {
          election_slug: string
          race_key: string
          race_title: string
          total_votes?: number
          updated_at?: string
        }
        Update: {
          election_slug?: string
          race_key?: string
          race_title?: string
          total_votes?: number
          updated_at?: string
        }
        Relationships: []
      }
      election_pulse_votes: {
        Row: {
          candidate_key: string
          candidate_name: string
          created_at: string
          election_slug: string
          id: string
          race_key: string
          race_title: string
          rank_preference: number
          updated_at: string
          user_id: string | null
          voter_key: string
        }
        Insert: {
          candidate_key: string
          candidate_name: string
          created_at?: string
          election_slug: string
          id?: string
          race_key: string
          race_title: string
          rank_preference?: number
          updated_at?: string
          user_id?: string | null
          voter_key: string
        }
        Update: {
          candidate_key?: string
          candidate_name?: string
          created_at?: string
          election_slug?: string
          id?: string
          race_key?: string
          race_title?: string
          rank_preference?: number
          updated_at?: string
          user_id?: string | null
          voter_key?: string
        }
        Relationships: []
      }
      elections: {
        Row: {
          created_at: string | null
          description: string | null
          election_date: string
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          election_date: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          election_date?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "friendships_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ge_courses: {
        Row: {
          course_id: string
          ge_area: string
          id: string
        }
        Insert: {
          course_id: string
          ge_area: string
          id?: string
        }
        Update: {
          course_id?: string
          ge_area?: string
          id?: string
        }
        Relationships: []
      }
      ge_progress: {
        Row: {
          completed: boolean | null
          course_taken: string | null
          created_at: string | null
          ge_area: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          course_taken?: string | null
          created_at?: string | null
          ge_area: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          course_taken?: string | null
          created_at?: string | null
          ge_area?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      grade_distributions: {
        Row: {
          avg_gpa: number | null
          course_level: string
          course_number: string
          created_at: string | null
          grade_a: number | null
          grade_a_minus: number | null
          grade_a_plus: number | null
          grade_b: number | null
          grade_b_minus: number | null
          grade_b_plus: number | null
          grade_c: number | null
          grade_c_minus: number | null
          grade_c_plus: number | null
          grade_d: number | null
          grade_d_minus: number | null
          grade_d_plus: number | null
          grade_f: number | null
          grade_np: number | null
          grade_p: number | null
          grade_s: number | null
          grade_u: number | null
          grade_w: number | null
          id: string
          instructor: string | null
          quarter: string
          total_students: number
        }
        Insert: {
          avg_gpa?: number | null
          course_level: string
          course_number: string
          created_at?: string | null
          grade_a?: number | null
          grade_a_minus?: number | null
          grade_a_plus?: number | null
          grade_b?: number | null
          grade_b_minus?: number | null
          grade_b_plus?: number | null
          grade_c?: number | null
          grade_c_minus?: number | null
          grade_c_plus?: number | null
          grade_d?: number | null
          grade_d_minus?: number | null
          grade_d_plus?: number | null
          grade_f?: number | null
          grade_np?: number | null
          grade_p?: number | null
          grade_s?: number | null
          grade_u?: number | null
          grade_w?: number | null
          id?: string
          instructor?: string | null
          quarter: string
          total_students?: number
        }
        Update: {
          avg_gpa?: number | null
          course_level?: string
          course_number?: string
          created_at?: string | null
          grade_a?: number | null
          grade_a_minus?: number | null
          grade_a_plus?: number | null
          grade_b?: number | null
          grade_b_minus?: number | null
          grade_b_plus?: number | null
          grade_c?: number | null
          grade_c_minus?: number | null
          grade_c_plus?: number | null
          grade_d?: number | null
          grade_d_minus?: number | null
          grade_d_plus?: number | null
          grade_f?: number | null
          grade_np?: number | null
          grade_p?: number | null
          grade_s?: number | null
          grade_u?: number | null
          grade_w?: number | null
          id?: string
          instructor?: string | null
          quarter?: string
          total_students?: number
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      major_course_options: {
        Row: {
          course_id: string
          created_at: string
          id: string
          requirement_item_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          requirement_item_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          requirement_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "major_course_options_requirement_item_id_fkey"
            columns: ["requirement_item_id"]
            isOneToOne: false
            referencedRelation: "major_requirement_items"
            referencedColumns: ["id"]
          },
        ]
      }
      major_requirement_items: {
        Row: {
          advising_note: string | null
          created_at: string
          id: string
          item_code: string | null
          item_title: string
          item_type: string
          min_count: number
          prerequisite_note: string | null
          requirement_id: string
          sort_order: number
        }
        Insert: {
          advising_note?: string | null
          created_at?: string
          id?: string
          item_code?: string | null
          item_title: string
          item_type: string
          min_count?: number
          prerequisite_note?: string | null
          requirement_id: string
          sort_order?: number
        }
        Update: {
          advising_note?: string | null
          created_at?: string
          id?: string
          item_code?: string | null
          item_title?: string
          item_type?: string
          min_count?: number
          prerequisite_note?: string | null
          requirement_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "major_requirement_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "major_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      major_requirements: {
        Row: {
          created_at: string
          id: string
          major_code: string
          major_name: string
          requirement_group: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          major_code: string
          major_name: string
          requirement_group: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          major_code?: string
          major_name?: string
          requirement_group?: string
          sort_order?: number
        }
        Relationships: []
      }
      meeting_attendance: {
        Row: {
          created_at: string | null
          id: string
          meeting_date: string
          meeting_type: string
          official_id: string
          present: boolean
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_date: string
          meeting_type?: string
          official_id: string
          present?: boolean
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string
          official_id?: string
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          body: string | null
          canonical_source_url: string | null
          category: string
          created_at: string | null
          id: string
          image_url: string | null
          published_at: string | null
          source_url: string | null
          summary: string
          title: string
        }
        Insert: {
          body?: string | null
          canonical_source_url?: string | null
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_url?: string | null
          summary: string
          title: string
        }
        Update: {
          body?: string | null
          canonical_source_url?: string | null
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          day_start_digest_enabled: boolean | null
          events_enabled: boolean | null
          id: string
          leave_now_enabled: boolean | null
          news_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          schedule_enabled: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_start_digest_enabled?: boolean | null
          events_enabled?: boolean | null
          id?: string
          leave_now_enabled?: boolean | null
          news_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          schedule_enabled?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_start_digest_enabled?: boolean | null
          events_enabled?: boolean | null
          id?: string
          leave_now_enabled?: boolean | null
          news_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          schedule_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      officials: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          party: string | null
          photo_url: string | null
          position: string
          term_end: string
          term_start: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          party?: string | null
          photo_url?: string | null
          position: string
          term_end: string
          term_start: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          party?: string | null
          photo_url?: string | null
          position?: string
          term_end?: string
          term_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ops_alert_delivery_config: {
        Row: {
          alerts_enabled: boolean
          discord_webhook_url: string | null
          id: boolean
          updated_at: string
        }
        Insert: {
          alerts_enabled?: boolean
          discord_webhook_url?: string | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          alerts_enabled?: boolean
          discord_webhook_url?: string | null
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      planner_onboarding_metrics: {
        Row: {
          completed_courses_count: number
          created_at: string
          first_week_retained: boolean
          first_week_retained_at: string | null
          id: string
          major_code: string | null
          onboarding_completed_at: string
          retention_checked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_courses_count?: number
          created_at?: string
          first_week_retained?: boolean
          first_week_retained_at?: string | null
          id?: string
          major_code?: string | null
          onboarding_completed_at?: string
          retention_checked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_courses_count?: number
          created_at?: string
          first_week_retained?: boolean
          first_week_retained_at?: string | null
          id?: string
          major_code?: string | null
          onboarding_completed_at?: string
          retention_checked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promises: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          description: string
          evidence_url: string | null
          id: string
          official_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          description: string
          evidence_url?: string | null
          id?: string
          official_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          description?: string
          evidence_url?: string | null
          id?: string
          official_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promises_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promises_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          amount_cents: number
          code_used: string
          created_at: string
          credited_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payout_method: string | null
          payout_reference: string | null
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          amount_cents?: number
          code_used: string
          created_at?: string
          credited_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          code_used?: string
          created_at?: string
          credited_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          max_members: number | null
          meeting_location: string | null
          meeting_time: string | null
          name: string
          quarter: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          max_members?: number | null
          meeting_location?: string | null
          meeting_time?: string | null
          name: string
          quarter: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          max_members?: number | null
          meeting_location?: string | null
          meeting_time?: string | null
          name?: string
          quarter?: string
        }
        Relationships: []
      }
      user_badge_progress: {
        Row: {
          badge_id: string
          created_at: string
          current_value: number
          id: string
          is_earned: boolean
          last_synced_at: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          current_value?: number
          id?: string
          is_earned?: boolean
          last_synced_at?: string
          target_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          current_value?: number
          id?: string
          is_earned?: boolean
          last_synced_at?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["badge_id"]
          },
          {
            foreignKeyName: "user_badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "stats_top_badges"
            referencedColumns: ["badge_id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["badge_id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "stats_top_badges"
            referencedColumns: ["badge_id"]
          },
        ]
      }
      user_completed_courses: {
        Row: {
          course_id: string
          created_at: string
          grade: string | null
          id: string
          quarter: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          grade?: string | null
          id?: string
          quarter?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          grade?: string | null
          id?: string
          quarter?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          course_id: string
          created_at: string | null
          enroll_code: string
          id: string
          quarter: string
          title: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          enroll_code: string
          id?: string
          quarter: string
          title: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          enroll_code?: string
          id?: string
          quarter?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "user_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_degree_plan: {
        Row: {
          course_id: string
          created_at: string
          id: string
          quarter: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          quarter: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          quarter?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_degree_plan_progress: {
        Row: {
          completed_count: number
          completion_pct: number
          id: string
          in_progress_count: number
          major_code: string | null
          remaining_count: number
          term: string | null
          total_requirements: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          completion_pct?: number
          id?: string
          in_progress_count?: number
          major_code?: string | null
          remaining_count?: number
          term?: string | null
          total_requirements?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number
          completion_pct?: number
          id?: string
          in_progress_count?: number
          major_code?: string | null
          remaining_count?: number
          term?: string | null
          total_requirements?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          app_version: string | null
          build_number: string | null
          category: string
          created_at: string
          email: string | null
          id: string
          ios_version: string | null
          message: string
          signed_in: boolean
          status: string
          subject: string | null
          theme: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          build_number?: string | null
          category: string
          created_at?: string
          email?: string | null
          id?: string
          ios_version?: string | null
          message: string
          signed_in?: boolean
          status?: string
          subject?: string | null
          theme?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          build_number?: string | null
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          ios_version?: string | null
          message?: string
          signed_in?: boolean
          status?: string
          subject?: string | null
          theme?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_gamification_profiles: {
        Row: {
          created_at: string
          last_active_at: string
          last_check_in_at: string | null
          level: number
          streak_days: number
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          created_at?: string
          last_active_at?: string
          last_check_in_at?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          created_at?: string
          last_active_at?: string
          last_check_in_at?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          created_at: string
          horizontal_accuracy_m: number | null
          latitude: number
          longitude: number
          status_emoji: string | null
          status_text: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          horizontal_accuracy_m?: number | null
          latitude: number
          longitude: number
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          horizontal_accuracy_m?: number | null
          latitude?: number
          longitude?: number
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          class_level: string | null
          created_at: string | null
          display_name: string
          email: string
          expected_grad_term: string | null
          full_name: string | null
          housing_name: string | null
          housing_type: string | null
          id: string
          is_discoverable: boolean
          major_code: string | null
          onboarding_completed_at: string | null
          phone_number: string | null
          referral_code: string | null
          referral_credit_cents: number
          referral_payout_email: string | null
          referred_by_user_id: string | null
          show_badge_showcase_on_profile: boolean
          show_gamification_surfaces: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          class_level?: string | null
          created_at?: string | null
          display_name: string
          email: string
          expected_grad_term?: string | null
          full_name?: string | null
          housing_name?: string | null
          housing_type?: string | null
          id: string
          is_discoverable?: boolean
          major_code?: string | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          referral_code?: string | null
          referral_credit_cents?: number
          referral_payout_email?: string | null
          referred_by_user_id?: string | null
          show_badge_showcase_on_profile?: boolean
          show_gamification_surfaces?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          class_level?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          expected_grad_term?: string | null
          full_name?: string | null
          housing_name?: string | null
          housing_type?: string | null
          id?: string
          is_discoverable?: boolean
          major_code?: string | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          referral_code?: string | null
          referral_credit_cents?: number
          referral_payout_email?: string | null
          referred_by_user_id?: string | null
          show_badge_showcase_on_profile?: boolean
          show_gamification_surfaces?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "user_profiles_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_schedule_events: {
        Row: {
          color: string
          course_description: string | null
          course_id: string | null
          created_at: string
          day_of_week: string
          end_hour: number
          end_minute: number
          enroll_code: string | null
          grading_option: string | null
          id: string
          instructor: string | null
          is_from_api: boolean
          location: string
          section: string | null
          start_hour: number
          start_minute: number
          title: string
          units: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          course_description?: string | null
          course_id?: string | null
          created_at?: string
          day_of_week: string
          end_hour: number
          end_minute: number
          enroll_code?: string | null
          grading_option?: string | null
          id?: string
          instructor?: string | null
          is_from_api?: boolean
          location?: string
          section?: string | null
          start_hour: number
          start_minute: number
          title: string
          units?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          course_description?: string | null
          course_id?: string | null
          created_at?: string
          day_of_week?: string
          end_hour?: number
          end_minute?: number
          enroll_code?: string | null
          grading_option?: string | null
          id?: string
          instructor?: string | null
          is_from_api?: boolean
          location?: string
          section?: string | null
          start_hour?: number
          start_minute?: number
          title?: string
          units?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schedule_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_payout_queue"
            referencedColumns: ["referrer_id"]
          },
          {
            foreignKeyName: "user_schedule_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp_events: {
        Row: {
          context: string | null
          created_at: string
          day_key: string
          id: string
          requested_xp: number
          source: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          context?: string | null
          created_at?: string
          day_key?: string
          id?: string
          requested_xp?: number
          source: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          context?: string | null
          created_at?: string
          day_key?: string
          id?: string
          requested_xp?: number
          source?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      week_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          user_id: string
          week_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          user_id: string
          week_key: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      weekly_academic_summaries: {
        Row: {
          attendance_pct: number
          classes_count: number
          created_at: string
          id: string
          milestones: Json
          planner_completion_pct: number
          share_payload: Json
          upcoming_finals_count: number
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          attendance_pct?: number
          classes_count?: number
          created_at?: string
          id?: string
          milestones?: Json
          planner_completion_pct?: number
          share_payload?: Json
          upcoming_finals_count?: number
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          attendance_pct?: number
          classes_count?: number
          created_at?: string
          id?: string
          milestones?: Json
          planner_completion_pct?: number
          share_payload?: Json
          upcoming_finals_count?: number
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          description: string
          id: number
          slug: string
          target_count: number
          target_source: string
          title: string
          week_start: string
          xp_reward: number
        }
        Insert: {
          description?: string
          id?: number
          slug: string
          target_count: number
          target_source: string
          title: string
          week_start: string
          xp_reward?: number
        }
        Update: {
          description?: string
          id?: number
          slug?: string
          target_count?: number
          target_source?: string
          title?: string
          week_start?: string
          xp_reward?: number
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed: {
        Row: {
          avatar_url: string | null
          context: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          points: number | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
      course_grade_summary: {
        Row: {
          course_id: string | null
          course_level: string | null
          course_number: string | null
          most_recent_quarter: string | null
          overall_avg_gpa: number | null
          pct_a: number | null
          pct_df: number | null
          sections_offered: number | null
          total_enrolled: number | null
        }
        Relationships: []
      }
      leaderboard_weekly: {
        Row: {
          rank: number | null
          user_id: string | null
          week_start: string | null
          xp: number | null
        }
        Relationships: []
      }
      major_requirement_quality_audit: {
        Row: {
          audit_notes: string[] | null
          audit_status: string | null
          issue_count: number | null
          major_code: string | null
          major_name: string | null
          option_group_count: number | null
          option_groups_missing_advising_note: number | null
          option_groups_without_options: number | null
          required_course_items_missing_code: number | null
          requirement_group_count: number | null
          requirement_item_count: number | null
          sequence_items_missing_prereq_note: number | null
        }
        Relationships: []
      }
      major_requirement_quality_issues: {
        Row: {
          issue_note: string | null
          issue_type: string | null
          item_reference: string | null
          major_code: string | null
          major_name: string | null
          requirement_group: string | null
        }
        Relationships: []
      }
      major_requirement_release_audit: {
        Row: {
          audit_notes: string[] | null
          audit_status: string | null
          is_release_priority: boolean | null
          issue_count: number | null
          major_code: string | null
          major_name: string | null
          option_group_count: number | null
          option_groups_missing_advising_note: number | null
          option_groups_without_options: number | null
          required_course_items_missing_code: number | null
          requirement_group_count: number | null
          requirement_item_count: number | null
          sequence_items_missing_prereq_note: number | null
        }
        Relationships: []
      }
      referral_payout_queue: {
        Row: {
          credited_count: number | null
          display_name: string | null
          oldest_credited_at: string | null
          referral_payout_email: string | null
          referrer_email: string | null
          referrer_id: string | null
          total_owed_cents: number | null
        }
        Relationships: []
      }
      stats_badges_by_rarity: {
        Row: {
          available: number | null
          earned: number | null
          rarity: string | null
        }
        Relationships: []
      }
      stats_class_levels: {
        Row: {
          class_level: string | null
          users: number | null
        }
        Relationships: []
      }
      stats_election_turnout: {
        Row: {
          distinct_voters: number | null
          race_count: number | null
          total_votes: number | null
        }
        Relationships: []
      }
      stats_majors: {
        Row: {
          major_code: string | null
          users: number | null
        }
        Relationships: []
      }
      stats_overview: {
        Row: {
          active_users_14d: number | null
          badges_earned: number | null
          class_vibes: number | null
          election_votes: number | null
          friendships: number | null
          lifetime_events: number | null
          lifetime_xp: number | null
          top_streak: number | null
          total_users: number | null
        }
        Relationships: []
      }
      stats_top_badges: {
        Row: {
          badge_id: string | null
          earned_count: number | null
          icon: string | null
          rarity: string | null
          title: string | null
        }
        Relationships: []
      }
      stats_xp_by_source: {
        Row: {
          avg_xp: number | null
          event_count: number | null
          source: string | null
          total_xp: number | null
        }
        Relationships: []
      }
      stats_xp_daily: {
        Row: {
          active_users: number | null
          day: string | null
          event_count: number | null
          total_xp: number | null
        }
        Relationships: []
      }
      weekly_academic_summary_rollup: {
        Row: {
          attendance_pct: number | null
          classes_count: number | null
          milestones: Json | null
          planner_completion_pct: number | null
          share_payload: Json | null
          upcoming_finals_count: number | null
          updated_at: string | null
          user_id: string | null
          week_start_date: string | null
        }
        Insert: {
          attendance_pct?: number | null
          classes_count?: number | null
          milestones?: Json | null
          planner_completion_pct?: number | null
          share_payload?: Json | null
          upcoming_finals_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date?: string | null
        }
        Update: {
          attendance_pct?: number | null
          classes_count?: number | null
          milestones?: Json | null
          planner_completion_pct?: number | null
          share_payload?: Json | null
          upcoming_finals_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_referral_code: { Args: { p_code: string }; Returns: string }
      award_user_xp: {
        Args: { p_context?: string; p_requested_xp?: number; p_source: string }
        Returns: {
          day_total_xp: number
          granted_xp: number
          last_check_in_at: string
          level: number
          streak_days: number
          total_xp: number
        }[]
      }
      calculate_action_score: {
        Args: { p_official_id: string }
        Returns: undefined
      }
      canonicalize_news_url: { Args: { raw_url: string }; Returns: string }
      cleanup_expired_class_confessions: { Args: never; Returns: number }
      compute_level_from_xp: { Args: { p_xp: number }; Returns: number }
      create_campus_pulse_post: {
        Args: { p_content: string; p_mood?: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_mine: boolean
          mood: string
          my_reactions: string[]
          reaction_count: number
        }[]
      }
      enqueue_ops_alert: {
        Args: { p_event_type: string; p_payload: Json }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      get_campus_pulse_feed: {
        Args: { limit_count?: number }
        Returns: {
          content: string
          created_at: string
          id: string
          is_mine: boolean
          mood: string
          my_reactions: string[]
          reaction_count: number
        }[]
      }
      get_classmate_counts: {
        Args: { p_quarter: string; p_user_id: string }
        Returns: {
          classmate_count: number
          course_key: string
          friend_count: number
        }[]
      }
      get_course_classmate_count: {
        Args: { p_course_id: string; p_quarter?: string }
        Returns: {
          display_count: string
          exact_count: number
        }[]
      }
      get_course_confessions: {
        Args: { p_course_key: string; p_limit?: number; p_quarter_code: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_mine: boolean
        }[]
      }
      get_course_confessions_ranked: {
        Args: {
          p_course_key: string
          p_limit?: number
          p_quarter_code: string
          p_sort?: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          is_mine: boolean
          my_vote: number
          score: number
        }[]
      }
      get_course_leaderboard: {
        Args: { p_limit?: number; p_quarter: string }
        Returns: {
          course_key: string
          user_count: number
        }[]
      }
      get_course_vibe: {
        Args: {
          p_course_key: string
          p_quarter_code: string
          p_week_number: number
        }
        Returns: {
          count: number
          pct: number
          rating: string
        }[]
      }
      get_election_pulse_results: {
        Args: { p_election_slug: string; p_voter_key?: string }
        Returns: {
          candidate_key: string
          candidate_name: string
          my_rank: number
          race_key: string
          race_title: string
          total_voters: number
          total_votes: number
          updated_at: string
          vote_count: number
        }[]
      }
      get_latest_daily_brief: {
        Args: never
        Returns: {
          body: string
          brief_date: string
          generated_at: string
          headline: string
          is_today: boolean
          kicker: string
        }[]
      }
      get_my_gamification_snapshot: {
        Args: never
        Returns: {
          last_check_in_at: string
          level: number
          streak_days: number
          today_xp: number
          xp_total: number
        }[]
      }
      get_suggested_friends: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          class_level: string
          display_name: string
          email: string
          id: string
          major_code: string
          mutual_friend_count: number
          shared_class_count: number
          shared_course_preview: string[]
        }[]
      }
      get_visible_user_locations: {
        Args: { within_minutes?: number }
        Returns: {
          horizontal_accuracy_m: number
          is_friend: boolean
          is_self: boolean
          latitude: number
          longitude: number
          status_emoji: string
          status_text: string
          updated_at: string
          user_id: string
        }[]
      }
      is_conversation_member: { Args: { conv_id: string }; Returns: boolean }
      normalize_course_id: { Args: { input: string }; Returns: string }
      purge_stale_campus_pulse: { Args: never; Returns: undefined }
      purge_stale_user_locations: { Args: never; Returns: undefined }
      recalculate_all_scores: { Args: never; Returns: undefined }
      refresh_election_pulse_race_totals: {
        Args: {
          p_election_slug: string
          p_race_key: string
          p_race_title?: string
        }
        Returns: undefined
      }
      refresh_grade_summary: { Args: never; Returns: undefined }
      refresh_leaderboard_weekly: { Args: never; Returns: undefined }
      register_device_token: {
        Args: { p_platform?: string; p_token: string }
        Returns: undefined
      }
      render_ops_alert_message: {
        Args: { p_event_type: string; p_payload: Json }
        Returns: string
      }
      report_course_confession: {
        Args: { p_confession_id: string; p_reason?: string }
        Returns: undefined
      }
      submit_course_confession: {
        Args: { p_body: string; p_course_key: string; p_quarter_code: string }
        Returns: string
      }
      submit_election_pulse_vote: {
        Args: {
          p_candidate_key: string
          p_candidate_name: string
          p_election_slug: string
          p_race_key: string
          p_race_title: string
          p_rank_preference?: number
          p_voter_key?: string
        }
        Returns: undefined
      }
      vote_class_confession: {
        Args: { p_confession_id: string; p_vote: number }
        Returns: undefined
      }
      xp_daily_cap_for_source: { Args: { p_source: string }; Returns: number }
      xp_default_for_source: { Args: { p_source: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
