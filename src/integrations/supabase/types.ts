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
  public: {
    Tables: {
      association_members: {
        Row: {
          association_id: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          association_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          association_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address: string | null
          building_year: number | null
          city: string | null
          created_at: string | null
          has_elevator: boolean | null
          has_parking: boolean | null
          id: string
          name: string
          num_floors: number | null
          num_units: number
          postal_code: string | null
          square_meters_total: number | null
          subscription_status: string | null
          subscription_tier: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          building_year?: number | null
          city?: string | null
          created_at?: string | null
          has_elevator?: boolean | null
          has_parking?: boolean | null
          id?: string
          name: string
          num_floors?: number | null
          num_units?: number
          postal_code?: string | null
          square_meters_total?: number | null
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          building_year?: number | null
          city?: string | null
          created_at?: string | null
          has_elevator?: boolean | null
          has_parking?: boolean | null
          id?: string
          name?: string
          num_floors?: number | null
          num_units?: number
          postal_code?: string | null
          square_meters_total?: number | null
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          association_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          association_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          association_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_messages: {
        Row: {
          bid_id: string
          created_at: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          bid_id: string
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          bid_id?: string
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_messages_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_requests: {
        Row: {
          association_id: string
          category_id: string
          created_at: string | null
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          category_id: string
          created_at?: string | null
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          category_id?: string
          created_at?: string | null
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bid_request_id: string
          created_at: string | null
          description: string | null
          id: string
          provider_id: string
          status: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          amount: number
          bid_request_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id: string
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number
          bid_request_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id?: string
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bid_request_id_fkey"
            columns: ["bid_request_id"]
            isOneToOne: false
            referencedRelation: "bid_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name_en: string | null
          name_is: string
          parent_category_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name_en?: string | null
          name_is: string
          parent_category_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name_en?: string | null
          name_is?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          housing_association: string | null
          id: string
          role_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          housing_association?: string | null
          id?: string
          role_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          housing_association?: string | null
          id?: string
          role_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_portfolio_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          provider_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          provider_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          provider_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolio_images_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          association_id: string
          bid_request_id: string
          comment: string | null
          created_at: string | null
          created_by: string
          id: string
          provider_id: string
          provider_response: string | null
          rating: number
          response_at: string | null
          updated_at: string | null
        }
        Insert: {
          association_id: string
          bid_request_id: string
          comment?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          provider_id: string
          provider_response?: string | null
          rating: number
          response_at?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          bid_request_id?: string
          comment?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          provider_id?: string
          provider_response?: string | null
          rating?: number
          response_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_bid_request_id_fkey"
            columns: ["bid_request_id"]
            isOneToOne: false
            referencedRelation: "bid_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_categories: {
        Row: {
          category_id: string
          id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          id?: string
          provider_id: string
        }
        Update: {
          category_id?: string
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          company_name: string
          created_at: string | null
          description_en: string | null
          description_is: string | null
          email: string | null
          id: string
          is_approved: boolean | null
          kennitala: string | null
          logo_url: string | null
          phone: string | null
          service_area: Json | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description_en?: string | null
          description_is?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          kennitala?: string | null
          logo_url?: string | null
          phone?: string | null
          service_area?: Json | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description_en?: string | null
          description_is?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          kennitala?: string | null
          logo_url?: string | null
          phone?: string | null
          service_area?: Json | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system: boolean
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system?: boolean
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          association_id: string
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_stage: number | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          related_entity_id: string | null
          source: string | null
          status: string
          title: string
          total_stages: number | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          assigned_to?: string | null
          association_id: string
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          source?: string | null
          status?: string
          title: string
          total_stages?: number | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          assigned_to?: string | null
          association_id?: string
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          source?: string | null
          status?: string
          title?: string
          total_stages?: number | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          association_id: string
          balance: number | null
          categorized_by_user_id: string | null
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          is_income: boolean | null
          is_individual_payment: boolean | null
          manually_categorized: boolean | null
          notes: string | null
          original_description: string | null
          uploaded_batch_id: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          association_id: string
          balance?: number | null
          categorized_by_user_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          is_income?: boolean | null
          is_individual_payment?: boolean | null
          manually_categorized?: boolean | null
          notes?: string | null
          original_description?: string | null
          uploaded_batch_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          association_id?: string
          balance?: number | null
          categorized_by_user_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_income?: boolean | null
          is_individual_payment?: boolean | null
          manually_categorized?: boolean | null
          notes?: string | null
          original_description?: string | null
          uploaded_batch_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_uploaded_batch_id_fkey"
            columns: ["uploaded_batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_batches: {
        Row: {
          association_id: string
          created_at: string | null
          file_name: string | null
          file_type: string | null
          id: string
          row_count: number | null
          uploaded_by: string
        }
        Insert: {
          association_id: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          row_count?: number | null
          uploaded_by: string
        }
        Update: {
          association_id?: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          row_count?: number | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_batches_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_rules: {
        Row: {
          association_id: string | null
          category_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          keyword_pattern: string
          priority: number | null
          vendor_id: string | null
        }
        Insert: {
          association_id?: string | null
          category_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          keyword_pattern: string
          priority?: number | null
          vendor_id?: string | null
        }
        Update: {
          association_id?: string | null
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          keyword_pattern?: string
          priority?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_rules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_rules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string | null
          default_category_id: string | null
          id: string
          is_verified: boolean | null
          kennitala: string | null
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          default_category_id?: string | null
          id?: string
          is_verified?: boolean | null
          kennitala?: string | null
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          default_category_id?: string | null
          id?: string
          is_verified?: boolean | null
          kennitala?: string | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_association_admin: { Args: { assoc_id: string }; Returns: boolean }
      is_association_member: { Args: { assoc_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
