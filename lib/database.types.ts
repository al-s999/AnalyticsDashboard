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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          country_code: string | null
          country_id: number | null
          created_at: string | null
          flag: number | null
          id: number
          latitude: number | null
          level: string | null
          longitude: number | null
          name: string | null
          native: string | null
          parent_id: string | null
          population: string | null
          state_code: string | null
          state_id: number | null
          timezone: string | null
          translations: Json | null
          type: string | null
          updated_at: string | null
          wikiDataId: string | null
        }
        Insert: {
          country_code?: string | null
          country_id?: number | null
          created_at?: string | null
          flag?: number | null
          id: number
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name?: string | null
          native?: string | null
          parent_id?: string | null
          population?: string | null
          state_code?: string | null
          state_id?: number | null
          timezone?: string | null
          translations?: Json | null
          type?: string | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Update: {
          country_code?: string | null
          country_id?: number | null
          created_at?: string | null
          flag?: number | null
          id?: number
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name?: string | null
          native?: string | null
          parent_id?: string | null
          population?: string | null
          state_code?: string | null
          state_id?: number | null
          timezone?: string | null
          translations?: Json | null
          type?: string | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Relationships: []
      }
      competition_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      competition_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_advanced: boolean
          participant_id: string
          score: number
          time_seconds: number | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id: string
          is_advanced?: boolean
          participant_id: string
          score?: number
          time_seconds?: number | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_advanced?: boolean
          participant_id?: string
          score?: number
          time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          quiz_ids: string[] | null
          round_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          quiz_ids?: string[] | null
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          quiz_ids?: string[] | null
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_groups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_participants: {
        Row: {
          category: string | null
          competition_id: string | null
          id: string
          is_paid: boolean | null
          registered_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          competition_id?: string | null
          id: string
          is_paid?: boolean | null
          registered_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          competition_id?: string | null
          id?: string
          is_paid?: boolean | null
          registered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_participants_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rounds: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          name: string
          round_order: number
          status: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id: string
          name: string
          round_order: number
          status?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          name?: string
          round_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_rounds_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          final_end_date: string | null
          final_start_date: string | null
          id: string
          poster_url: string | null
          prize_pool: string | null
          qualification_end_date: string | null
          qualification_start_date: string | null
          registration_end_date: string
          registration_fee: string | null
          registration_link: string | null
          registration_start_date: string
          rules: string[] | null
          slug: string
          status: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          final_end_date?: string | null
          final_start_date?: string | null
          id: string
          poster_url?: string | null
          prize_pool?: string | null
          qualification_end_date?: string | null
          qualification_start_date?: string | null
          registration_end_date: string
          registration_fee?: string | null
          registration_link?: string | null
          registration_start_date: string
          rules?: string[] | null
          slug: string
          status?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          final_end_date?: string | null
          final_start_date?: string | null
          id?: string
          poster_url?: string | null
          prize_pool?: string | null
          qualification_end_date?: string | null
          qualification_start_date?: string | null
          registration_end_date?: string
          registration_fee?: string | null
          registration_link?: string | null
          registration_start_date?: string
          rules?: string[] | null
          slug?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          capital: string | null
          created_at: string | null
          currency: string | null
          currency_name: string | null
          currency_symbol: string | null
          emoji: string | null
          emojiU: string | null
          flag: number | null
          gdp: string | null
          id: number
          iso2: string | null
          iso3: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          nationality: string | null
          native: string | null
          numeric_code: number | null
          phonecode: number | null
          population: string | null
          region: string | null
          region_id: string | null
          subregion: string | null
          subregion_id: string | null
          timezones: Json | null
          tld: string | null
          translations: Json | null
          updated_at: string | null
          wikiDataId: string | null
        }
        Insert: {
          capital?: string | null
          created_at?: string | null
          currency?: string | null
          currency_name?: string | null
          currency_symbol?: string | null
          emoji?: string | null
          emojiU?: string | null
          flag?: number | null
          gdp?: string | null
          id: number
          iso2?: string | null
          iso3?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          native?: string | null
          numeric_code?: number | null
          phonecode?: number | null
          population?: string | null
          region?: string | null
          region_id?: string | null
          subregion?: string | null
          subregion_id?: string | null
          timezones?: Json | null
          tld?: string | null
          translations?: Json | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Update: {
          capital?: string | null
          created_at?: string | null
          currency?: string | null
          currency_name?: string | null
          currency_symbol?: string | null
          emoji?: string | null
          emojiU?: string | null
          flag?: number | null
          gdp?: string | null
          id?: number
          iso2?: string | null
          iso3?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nationality?: string | null
          native?: string | null
          numeric_code?: number | null
          phonecode?: number | null
          population?: string | null
          region?: string | null
          region_id?: string | null
          subregion?: string | null
          subregion_id?: string | null
          timezones?: Json | null
          tld?: string | null
          translations?: Json | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          allow_join_after_start: boolean | null
          application: string
          countdown_started_at: string | null
          created_at: string | null
          current_questions: Json
          difficulty: string | null
          ended_at: string | null
          game_end_mode: string | null
          game_pin: string
          host_id: string
          id: string
          participants: Json | null
          question_limit: string | null
          quiz_detail: Json | null
          quiz_id: string | null
          responses: Json | null
          started_at: string | null
          status: string | null
          total_time_minutes: number | null
        }
        Insert: {
          allow_join_after_start?: boolean | null
          application?: string
          countdown_started_at?: string | null
          created_at?: string | null
          current_questions?: Json
          difficulty?: string | null
          ended_at?: string | null
          game_end_mode?: string | null
          game_pin: string
          host_id: string
          id?: string
          participants?: Json | null
          question_limit?: string | null
          quiz_detail?: Json | null
          quiz_id?: string | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          total_time_minutes?: number | null
        }
        Update: {
          allow_join_after_start?: boolean | null
          application?: string
          countdown_started_at?: string | null
          created_at?: string | null
          current_questions?: Json
          difficulty?: string | null
          ended_at?: string | null
          game_end_mode?: string | null
          game_pin?: string
          host_id?: string
          id?: string
          participants?: Json | null
          question_limit?: string | null
          quiz_detail?: Json | null
          quiz_id?: string | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          total_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          activities: Json | null
          avatar_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string | null
          creator_id: string
          deleted_at: string | null
          description: string | null
          id: string
          join_requests: Json | null
          members: Json | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          activities?: Json | null
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          join_requests?: Json | null
          members?: Json | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          activities?: Json | null
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          join_requests?: Json | null
          members?: Json | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          question_limit: string | null
          questions: Json | null
          quiz_id: string | null
          responses: Json | null
          started_at: string | null
          status: string | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          question_limit?: string | null
          questions?: Json | null
          quiz_id?: string | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          question_limit?: string | null
          questions?: Json | null
          quiz_id?: string | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_permissions: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_permissions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_permissions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          from_group_id: string | null
          id: string
          is_read: boolean | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          from_group_id?: string | null
          id?: string
          is_read?: boolean | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          from_group_id?: string | null
          id?: string
          is_read?: boolean | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_from_group_id_fkey"
            columns: ["from_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_since: string | null
          auth_user_id: string
          avatar_url: string | null
          birthdate: string | null
          blocked_at: string | null
          city_id: number | null
          country_id: number | null
          created_at: string | null
          deleted_at: string | null
          email: string
          favorite_quiz: Json | null
          fullname: string | null
          gender: string | null
          grade: string | null
          id: string
          is_blocked: boolean | null
          is_profile_public: boolean | null
          language: string | null
          last_active: string | null
          nickname: string | null
          notifications: Json | null
          organization: string | null
          phone: string | null
          role: string | null
          state_id: number | null
          updated_at: string | null
          username: string
          ai_tokens_used: number
          ai_tokens_reset_date: string | null
        }
        Insert: {
          admin_since?: string | null
          auth_user_id: string
          avatar_url?: string | null
          birthdate?: string | null
          blocked_at?: string | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          favorite_quiz?: Json | null
          fullname?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          is_blocked?: boolean | null
          is_profile_public?: boolean | null
          language?: string | null
          last_active?: string | null
          nickname?: string | null
          notifications?: Json | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          state_id?: number | null
          updated_at?: string | null
          username: string
          ai_tokens_used?: number
          ai_tokens_reset_date?: string | null
        }
        Update: {
          admin_since?: string | null
          auth_user_id?: string
          avatar_url?: string | null
          birthdate?: string | null
          blocked_at?: string | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          favorite_quiz?: Json | null
          fullname?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          is_blocked?: boolean | null
          is_profile_public?: boolean | null
          language?: string | null
          last_active?: string | null
          nickname?: string | null
          notifications?: Json | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          state_id?: number | null
          updated_at?: string | null
          username?: string
          ai_tokens_used?: number
          ai_tokens_reset_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_country"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_state"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string | null
          creator_id: string
          deleted_at: string | null
          description: string | null
          favorite: Json | null
          grade: string | null
          hidden_at: string | null
          hidden_reason: string | null
          id: string
          image_url: string | null
          is_hidden: boolean | null
          is_public: boolean | null
          language: string | null
          played: number | null
          questions: Json | null
          request: boolean | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          favorite?: Json | null
          grade?: string | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          is_public?: boolean | null
          language?: string | null
          played?: number | null
          questions?: Json | null
          request?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          favorite?: Json | null
          grade?: string | null
          hidden_at?: string | null
          hidden_reason?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          is_public?: boolean | null
          language?: string | null
          played?: number | null
          questions?: Json | null
          request?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string
          evidence_url: string | null
          id: string
          messages: Json | null
          report_type: string
          reported_content_id: string | null
          reported_content_type: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description: string
          evidence_url?: string | null
          id?: string
          messages?: Json | null
          report_type: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string
          evidence_url?: string | null
          id?: string
          messages?: Json | null
          report_type?: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_content_id_fkey"
            columns: ["reported_content_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          country_code: string | null
          country_id: number | null
          created_at: string | null
          fips_code: string | null
          flag: number | null
          id: number
          iso2: string | null
          iso3166_2: string | null
          latitude: number | null
          level: string | null
          longitude: number | null
          name: string | null
          native: string | null
          parent_id: string | null
          population: string | null
          timezone: string | null
          translations: Json | null
          type: string | null
          updated_at: string | null
          wikiDataId: string | null
        }
        Insert: {
          country_code?: string | null
          country_id?: number | null
          created_at?: string | null
          fips_code?: string | null
          flag?: number | null
          id: number
          iso2?: string | null
          iso3166_2?: string | null
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name?: string | null
          native?: string | null
          parent_id?: string | null
          population?: string | null
          timezone?: string | null
          translations?: Json | null
          type?: string | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Update: {
          country_code?: string | null
          country_id?: number | null
          created_at?: string | null
          fips_code?: string | null
          flag?: number | null
          id?: number
          iso2?: string | null
          iso3166_2?: string | null
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name?: string | null
          native?: string | null
          parent_id?: string | null
          population?: string | null
          timezone?: string | null
          translations?: Json | null
          type?: string | null
          updated_at?: string | null
          wikiDataId?: string | null
        }
        Relationships: []
      }
      user_quota: {
        Row: {
          date: string | null
          id: string
          token: number | null
          user_id: string
        }
        Insert: {
          date?: string | null
          id?: string
          token?: number | null
          user_id: string
        }
        Update: {
          date?: string | null
          id?: string
          token?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quota_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_group_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_group_id: string
          p_metadata?: Json
          p_user_id: string
          p_username: string
        }
        Returns: string
      }
      add_group_member: {
        Args: { p_group_id: string; p_role?: string; p_user_id: string }
        Returns: boolean
      }
      add_join_request: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: string
      }
      add_push_subscription: {
        Args: { p_subscription: Json; p_user_id: string }
        Returns: boolean
      }
      add_user_notification: {
        Args: {
          p_data?: Json
          p_expires_at?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      analyze_question_performance: {
        Args: { p_question_id: string; p_session_id: string }
        Returns: {
          accuracy_percentage: number
          answer_distribution: Json
          average_response_time: number
          correct_responses: number
          question_id: string
          question_text: string
          total_responses: number
        }[]
      }
      calculate_all_scores: {
        Args: { session_id_input: string }
        Returns: number
      }
      calculate_points: {
        Args: { base_points: number; response_time: number; time_limit: number }
        Returns: number
      }
      calculate_score: {
        Args: { participant_id_input: string; session_id_input: string }
        Returns: number
      }
      can_send_friend_request: {
        Args: { addressee_id: string; requester_id: string }
        Returns: boolean
      }
      cleanup_expired_game_notifications: { Args: never; Returns: number }
      cleanup_expired_notifications: { Args: never; Returns: number }
      cleanup_game_invite_for_session: {
        Args: { p_immediate?: boolean; p_session_id: string }
        Returns: number
      }
      cleanup_trash_bin: { Args: never; Returns: undefined }
      count_answered_questions: {
        Args: { responses_data: Json }
        Returns: number
      }
      create_report: {
        Args: {
          description_param: string
          evidence_url_param?: string
          report_type_param: string
          reported_content_id_param?: string
          reported_content_type_param: string
          reported_user_id_param?: string
          reporter_id_param: string
          title_param: string
        }
        Returns: string
      }
      deactivate_push_subscription: {
        Args: { p_endpoint: string; p_failure_reason?: string }
        Returns: boolean
      }
      delete_user_notification: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      end_game_session: {
        Args: { p_app_name: string; p_session_id: string }
        Returns: undefined
      }
      finalize_player_session: {
        Args: {
          p_app_name: string
          p_participant_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      generate_game_pin: { Args: never; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      generate_xid: { Args: never; Returns: string }
      get_application_context: { Args: never; Returns: string }
      get_auth_user_id_by_profile_id: {
        Args: { p_profile_id: string }
        Returns: string
      }
      get_dashboard_data_optimized: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_friend_requests: {
        Args: { request_type?: string; user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          friendship_id: string
          fullname: string
          mutual_friends_count: number
          user_id_result: string
          username: string
        }[]
      }
      get_friend_suggestions: {
        Args: { limit_count?: number; user_id: string }
        Returns: {
          avatar_url: string
          common_groups_count: number
          fullname: string
          mutual_friends_count: number
          suggested_user_id: string
          username: string
        }[]
      }
      get_friend_suggestions_enhanced: {
        Args: { limit_count?: number; user_id: string }
        Returns: {
          avatar_url: string
          common_groups_count: number
          fullname: string
          mutual_friends_count: number
          suggested_user_id: string
          username: string
        }[]
      }
      get_friends_list: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
          user_id: string
        }
        Returns: {
          avatar_url: string
          friend_id: string
          friendship_id: string
          fullname: string
          is_online: boolean
          last_active: string
          mutual_friends_count: number
          username: string
        }[]
      }
      get_friendship_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: {
          friendship_id: string
          is_requester: boolean
          status: Database["public"]["Enums"]["friendship_status"]
        }[]
      }
      get_public_profile_counts: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      get_game_leaderboard: {
        Args: { p_session_id: string }
        Returns: {
          avatar_url: string
          nickname: string
          participant_id: string
          rank: number
          score: number
          total_completion_time: number
          user_id: string
        }[]
      }
      get_group_category_counts: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      get_leaderboard: {
        Args: { p_session_id: string }
        Returns: {
          average_response_time: number
          correct_answers: number
          nickname: string
          participant_id: string
          rank_position: number
          total_questions: number
          total_score: number
        }[]
      }
      get_mutual_friends_count:
        | {
            Args: { user_uuid: string }
            Returns: {
              followers_count: number
              following_count: number
              friends_count: number
            }[]
          }
        | { Args: { user1_id: string; user2_id: string }; Returns: number }
      get_profile_by_auth_user_id: {
        Args: { p_auth_user_id: string }
        Returns: {
          admin_since: string | null
          auth_user_id: string
          avatar_url: string | null
          birthdate: string | null
          blocked_at: string | null
          city_id: number | null
          country_id: number | null
          created_at: string | null
          deleted_at: string | null
          email: string
          favorite_quiz: Json | null
          fullname: string | null
          gender: string | null
          grade: string | null
          id: string
          is_blocked: boolean | null
          is_profile_public: boolean | null
          language: string | null
          last_active: string | null
          nickname: string | null
          notifications: Json | null
          organization: string | null
          phone: string | null
          role: string | null
          state_id: number | null
          updated_at: string | null
          username: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_profile_id_by_auth_user_id: {
        Args: { p_auth_user_id: string }
        Returns: string
      }
      get_push_preferences: {
        Args: { p_user_id: string }
        Returns: {
          admin_actions: boolean
          chat_messages: boolean
          enabled: boolean
          friend_requests: boolean
          game_invites: boolean
          group_invites: boolean
          new_followers: boolean
          quiz_results: boolean
        }[]
      }
      get_question_ids_from_learn_session: {
        Args: { session_id: string }
        Returns: string[]
      }
      get_quiz_play_count: { Args: { p_quiz_id: string }; Returns: number }
      get_quizzes_paginated: {
        Args: {
          p_category_filter?: string
          p_creator_filter?: string
          p_favorites_filter?: string[]
          p_limit?: number
          p_offset?: number
          p_search_query?: string
          p_user_id?: string
        }
        Returns: {
          category: string
          created_at: string
          creator_id: string
          id: string
          is_public: boolean
          question_count: number
          title: string
          total_count: number
        }[]
      }
      get_quizzes_with_question_count: {
        Args: { user_id?: string }
        Returns: {
          category: string
          created_at: string
          creator_id: string
          id: string
          is_public: boolean
          question_count: number
          title: string
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      get_total_points_from_responses: {
        Args: { responses_data: Json }
        Returns: number
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_groups: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          cover_url: string
          created_at: string
          creator_id: string
          description: string
          id: string
          invite_code: string
          is_active: boolean
          is_public: boolean
          max_members: number
          member_count: number
          name: string
          updated_at: string
          user_role: string
        }[]
      }
      get_user_notifications: {
        Args: {
          p_limit?: number
          p_type?: string
          p_unread_only?: boolean
          p_user_id: string
        }
        Returns: {
          created_at: string
          data: Json
          expires_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string
          title: string
          type: string
        }[]
      }
      get_user_push_subscriptions: {
        Args: { p_user_id: string }
        Returns: {
          auth_key: string
          browser_name: string
          created_at: string
          device_type: string
          endpoint: string
          id: string
          p256dh_key: string
        }[]
      }
      get_user_stats_simple: {
        Args: { user_xid: string }
        Returns: {
          total_game_sessions: number
          total_groups: number
          total_quizzes: number
          unread_notifications: number
        }[]
      }
      join_game_session: {
        Args: {
          p_app_name: string
          p_new_participant: Json
          p_session_id: string
        }
        Returns: Json
      }
      log_push_notification: {
        Args: {
          p_badge?: string
          p_body: string
          p_data?: Json
          p_icon?: string
          p_image?: string
          p_notification_type: string
          p_subscription_id: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      merge_session_participants_main: {
        Args: { p_new_data: Json; p_session_id: string }
        Returns: undefined
      }
      process_game_responses_batch: {
        Args: { p_responses: Json; p_session_id: string }
        Returns: {
          error_count: number
          errors: Json
          processed: number
          success: number
        }[]
      }
      remove_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      remove_participant_from_session: {
        Args: {
          p_app_name: string
          p_participant_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      remove_push_subscription:
        | { Args: { p_endpoint: string }; Returns: boolean }
        | { Args: { p_endpoint: string; p_user_id: string }; Returns: boolean }
      select_questions_for_session: {
        Args: {
          p_question_limit?: string
          p_quiz_id: string
          p_session_id: string
        }
        Returns: Json
      }
      send_friend_request_safe: {
        Args: { addressee_id: string; requester_id: string }
        Returns: {
          friendship_id: string
          message: string
          success: boolean
        }[]
      }
      set_application_context: {
        Args: { app_name: string }
        Returns: undefined
      }
      set_player_racing_status: {
        Args: {
          p_app_name: string
          p_is_racing: boolean
          p_participant_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      shuffle_questions_for_player: {
        Args: { p_participant_id: string; p_questions: Json }
        Returns: Json
      }
      test_score_calculation: {
        Args: { session_id_input: string }
        Returns: {
          calculated_score: number
          correct_answers: number
          nickname: string
          participant_id: string
          responses_count: number
        }[]
      }
      update_participant_car: {
        Args: {
          p_app_name: string
          p_new_car: string
          p_participant_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      update_player_progress: {
        Args: {
          p_game_pin: string
          p_memory_progress?: Json
          p_player_id: string
          p_questions_answered: number
          p_quiz_score: number
        }
        Returns: boolean
      }
      update_player_response: {
        Args: {
          p_answer_id: string
          p_app_name: string
          p_is_correct: boolean
          p_participant_id: string
          p_question_id: string
          p_session_id: string
          p_total_questions: number
        }
        Returns: undefined
      }
      update_push_notification_status: {
        Args: {
          p_failure_reason?: string
          p_log_id: string
          p_response_body?: string
          p_response_status?: number
          p_status: string
        }
        Returns: boolean
      }
      update_push_preferences: {
        Args: { p_preferences: Json; p_user_id: string }
        Returns: boolean
      }
      upsert_push_preferences: {
        Args: { p_preferences: Json; p_user_id: string }
        Returns: string
      }
      upsert_push_subscription: {
        Args: {
          p_auth_key: string
          p_browser_name?: string
          p_device_type?: string
          p_endpoint: string
          p_os_name?: string
          p_p256dh_key: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      validate_answer_submission: {
        Args: {
          p_answer_id: string
          p_participant_id: string
          p_question_id: string
          p_session_id: string
        }
        Returns: {
          correct_answer_id: string
          error_message: string
          is_correct: boolean
          is_valid: boolean
          points: number
        }[]
      }
      validate_auth_user_reference: {
        Args: { auth_user_id_text: string }
        Returns: boolean
      }
      validate_learn_question_structure: {
        Args: { question_data: Json }
        Returns: boolean
      }
      validate_learn_questions_jsonb: {
        Args: { questions_data: Json }
        Returns: boolean
      }
      validate_learn_response_structure: {
        Args: { response_data: Json }
        Returns: boolean
      }
      validate_learn_responses_jsonb: {
        Args: { responses_data: Json }
        Returns: boolean
      }
      validate_learn_session_responses: {
        Args: { responses_data: Json }
        Returns: boolean
      }
      validate_user_reference: {
        Args: { user_id_text: string }
        Returns: boolean
      }
      validate_xid_format: { Args: { xid_text: string }; Returns: boolean }
    }
    Enums: {
      friendship_status: "pending" | "accepted" | "blocked" | "declined"
      notification_type:
        | "system"
        | "game_invite"
        | "achievement"
        | "warning"
        | "ban_notice"
        | "group_invitation"
        | "group_request_approved"
        | "group_request_rejected"
        | "group_member_joined"
        | "group_member_left"
      question_type: "multiple_choice" | "true_false" | "fill_blank"
      report_status: "pending" | "investigating" | "resolved" | "dismissed"
      session_status: "waiting" | "active" | "completed" | "cancelled"
      user_status: "active" | "banned" | "suspended"
      violation_severity: "low" | "medium" | "high" | "critical"
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
  public: {
    Enums: {
      friendship_status: ["pending", "accepted", "blocked", "declined"],
      notification_type: [
        "system",
        "game_invite",
        "achievement",
        "warning",
        "ban_notice",
        "group_invitation",
        "group_request_approved",
        "group_request_rejected",
        "group_member_joined",
        "group_member_left",
      ],
      question_type: ["multiple_choice", "true_false", "fill_blank"],
      report_status: ["pending", "investigating", "resolved", "dismissed"],
      session_status: ["waiting", "active", "completed", "cancelled"],
      user_status: ["active", "banned", "suspended"],
      violation_severity: ["low", "medium", "high", "critical"],
    },
  },
} as const
