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
      ai_analysis_rate_limit: {
        Row: {
          analysis_count: number
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          analysis_count?: number
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          analysis_count?: number
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      ai_analyzed_products: {
        Row: {
          allergens: string | null
          back_photo_url: string | null
          barcode: string | null
          brands: string | null
          carbohydrates: number | null
          created_at: string | null
          energy_kj: number | null
          fats: number | null
          fiber: number | null
          front_photo_url: string | null
          id: string
          image_url: string | null
          ingredients_text: string | null
          last_accessed_at: string | null
          nova_group: number | null
          nutriscore_grade: string | null
          nutrition_photo_url: string | null
          product_name: string
          proteins: number | null
          salt: number | null
          saturated_fats: number | null
          sodium: number | null
          sugars: number | null
          times_accessed: number | null
          user_id: string
        }
        Insert: {
          allergens?: string | null
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          carbohydrates?: number | null
          created_at?: string | null
          energy_kj?: number | null
          fats?: number | null
          fiber?: number | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          last_accessed_at?: string | null
          nova_group?: number | null
          nutriscore_grade?: string | null
          nutrition_photo_url?: string | null
          product_name: string
          proteins?: number | null
          salt?: number | null
          saturated_fats?: number | null
          sodium?: number | null
          sugars?: number | null
          times_accessed?: number | null
          user_id: string
        }
        Update: {
          allergens?: string | null
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          carbohydrates?: number | null
          created_at?: string | null
          energy_kj?: number | null
          fats?: number | null
          fiber?: number | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          last_accessed_at?: string | null
          nova_group?: number | null
          nutriscore_grade?: string | null
          nutrition_photo_url?: string | null
          product_name?: string
          proteins?: number | null
          salt?: number | null
          saturated_fats?: number | null
          sodium?: number | null
          sugars?: number | null
          times_accessed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          message: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          active_profiles_snapshot: Json | null
          admin_id: string | null
          admin_notes: string | null
          analysis_snapshot: Json | null
          barcode: string | null
          cache_cleared_at: string | null
          created_at: string
          error_category: string
          id: string
          product_name: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_description: string | null
          user_id: string
        }
        Insert: {
          active_profiles_snapshot?: Json | null
          admin_id?: string | null
          admin_notes?: string | null
          analysis_snapshot?: Json | null
          barcode?: string | null
          cache_cleared_at?: string | null
          created_at?: string
          error_category: string
          id?: string
          product_name: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_description?: string | null
          user_id: string
        }
        Update: {
          active_profiles_snapshot?: Json | null
          admin_id?: string | null
          admin_notes?: string | null
          analysis_snapshot?: Json | null
          barcode?: string | null
          cache_cleared_at?: string | null
          created_at?: string
          error_category?: string
          id?: string
          product_name?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_description?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          barcode: string | null
          brands: string | null
          created_at: string | null
          id: string
          image_url: string | null
          product_name: string
          scan_history_id: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          product_name: string
          scan_history_id?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          product_name?: string
          scan_history_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_scan_history_id_fkey"
            columns: ["scan_history_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      otp_rate_limit: {
        Row: {
          attempt_count: number
          created_at: string
          email: string
          id: string
          ip_address: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email: string
          id?: string
          ip_address: string
          window_start?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email?: string
          id?: string
          ip_address?: string
          window_start?: string
        }
        Relationships: []
      }
      profile_restrictions: {
        Row: {
          enabled: boolean | null
          id: string
          profile_id: string
          restriction_id: string
          severity_level: string
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          profile_id: string
          restriction_id: string
          severity_level?: string
        }
        Update: {
          enabled?: boolean | null
          id?: string
          profile_id?: string
          restriction_id?: string
          severity_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_restrictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          active_profiles_snapshot: Json
          allergens: string | null
          analysis_type: string
          back_photo_url: string | null
          barcode: string | null
          brands: string | null
          created_at: string | null
          ecoscore_grade: string | null
          front_photo_url: string | null
          id: string
          image_url: string | null
          ingredients_text: string | null
          is_compatible: boolean
          latitude: number | null
          longitude: number | null
          nova_group: number | null
          nutriscore_grade: string | null
          product_name: string
          score: number
          user_id: string
          violations: Json | null
          warnings: Json | null
        }
        Insert: {
          active_profiles_snapshot: Json
          allergens?: string | null
          analysis_type: string
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          ecoscore_grade?: string | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_compatible: boolean
          latitude?: number | null
          longitude?: number | null
          nova_group?: number | null
          nutriscore_grade?: string | null
          product_name: string
          score: number
          user_id: string
          violations?: Json | null
          warnings?: Json | null
        }
        Update: {
          active_profiles_snapshot?: Json
          allergens?: string | null
          analysis_type?: string
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          ecoscore_grade?: string | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_compatible?: boolean
          latitude?: number | null
          longitude?: number | null
          nova_group?: number | null
          nutriscore_grade?: string | null
          product_name?: string
          score?: number
          user_id?: string
          violations?: Json | null
          warnings?: Json | null
        }
        Relationships: []
      }
      scan_rate_limit: {
        Row: {
          created_at: string
          id: string
          scan_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          scan_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          scan_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          barcode: string | null
          cost_usd: number | null
          created_at: string | null
          event_type: string
          id: string
          product_name: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          cost_usd?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          product_name: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          cost_usd?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          product_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_logging_config: {
        Row: {
          created_at: string | null
          id: string
          logging_enabled: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logging_enabled?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logging_enabled?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          city: string | null
          community_stats_consent: boolean | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          community_stats_consent?: boolean | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          community_stats_consent?: boolean | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_scan_rate_limits: { Args: never; Returns: undefined }
      get_users_for_admin: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_logging_enabled: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
