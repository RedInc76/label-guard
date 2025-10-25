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
      ai_analyzed_products: {
        Row: {
          allergens: string | null
          back_photo_url: string | null
          barcode: string | null
          brands: string | null
          created_at: string | null
          front_photo_url: string | null
          id: string
          image_url: string | null
          ingredients_text: string | null
          last_accessed_at: string | null
          product_name: string
          times_accessed: number | null
          user_id: string
        }
        Insert: {
          allergens?: string | null
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          last_accessed_at?: string | null
          product_name: string
          times_accessed?: number | null
          user_id: string
        }
        Update: {
          allergens?: string | null
          back_photo_url?: string | null
          barcode?: string | null
          brands?: string | null
          created_at?: string | null
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          last_accessed_at?: string | null
          product_name?: string
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
      profile_custom_restrictions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          restriction_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          restriction_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          restriction_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_custom_restrictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_restrictions: {
        Row: {
          enabled: boolean | null
          id: string
          profile_id: string
          restriction_id: string
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          profile_id: string
          restriction_id: string
        }
        Update: {
          enabled?: boolean | null
          id?: string
          profile_id?: string
          restriction_id?: string
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
          front_photo_url: string | null
          id: string
          image_url: string | null
          ingredients_text: string | null
          is_compatible: boolean
          latitude: number | null
          longitude: number | null
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
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_compatible: boolean
          latitude?: number | null
          longitude?: number | null
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
          front_photo_url?: string | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_compatible?: boolean
          latitude?: number | null
          longitude?: number | null
          product_name?: string
          score?: number
          user_id?: string
          violations?: Json | null
          warnings?: Json | null
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
