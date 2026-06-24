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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          by_name: string | null
          by_ref: string | null
          by_role: string | null
          created_at: string
          id: string
          ip_address: string | null
          message: string | null
        }
        Insert: {
          action: string
          by_name?: string | null
          by_ref?: string | null
          by_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          message?: string | null
        }
        Update: {
          action?: string
          by_name?: string | null
          by_ref?: string | null
          by_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          message?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          auth_uid: string | null
          created_at: string
          email: string
          id: string
          ministry: string | null
          name: string
          password: string
          phone: string | null
          ref: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string
          email: string
          id?: string
          ministry?: string | null
          name: string
          password: string
          phone?: string | null
          ref?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          auth_uid?: string | null
          created_at?: string
          email?: string
          id?: string
          ministry?: string | null
          name?: string
          password?: string
          phone?: string | null
          ref?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          blood_group: string | null
          decided_at: string | null
          district: string
          dob: string | null
          enrollment_date: string | null
          fullname: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          level: string
          nationality: string | null
          parent_name: string | null
          parent_nida: string | null
          parent_phone: string | null
          photo: string | null
          region: string
          reject_reason: string | null
          relationship: string | null
          school_code: string
          school_contact: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          tsid: string | null
          ward: string
        }
        Insert: {
          blood_group?: string | null
          decided_at?: string | null
          district: string
          dob?: string | null
          enrollment_date?: string | null
          fullname: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          level: string
          nationality?: string | null
          parent_name?: string | null
          parent_nida?: string | null
          parent_phone?: string | null
          photo?: string | null
          region: string
          reject_reason?: string | null
          relationship?: string | null
          school_code: string
          school_contact?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          tsid?: string | null
          ward: string
        }
        Update: {
          blood_group?: string | null
          decided_at?: string | null
          district?: string
          dob?: string | null
          enrollment_date?: string | null
          fullname?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          level?: string
          nationality?: string | null
          parent_name?: string | null
          parent_nida?: string | null
          parent_phone?: string | null
          photo?: string | null
          region?: string
          reject_reason?: string | null
          relationship?: string | null
          school_code?: string
          school_contact?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          tsid?: string | null
          ward?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "applications_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
        ]
      }
      certificates: {
        Row: {
          id: string
          issued_at: string
          ref: string
          school_code: string
          school_name: string
          student_name: string
          title: string
          tsid: string
        }
        Insert: {
          id?: string
          issued_at?: string
          ref: string
          school_code: string
          school_name: string
          student_name: string
          title?: string
          tsid: string
        }
        Update: {
          id?: string
          issued_at?: string
          ref?: string
          school_code?: string
          school_name?: string
          student_name?: string
          title?: string
          tsid?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "certificates_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "certificates_tsid_fkey"
            columns: ["tsid"]
            isOneToOne: false
            referencedRelation: "public_student_search"
            referencedColumns: ["tsid"]
          },
          {
            foreignKeyName: "certificates_tsid_fkey"
            columns: ["tsid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["tsid"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          purpose: string | null
          ref: string
          school_code: string
          status: Database["public"]["Enums"]["payment_status"]
          student_name: string
          tsid: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          purpose?: string | null
          ref?: string
          school_code: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_name: string
          tsid: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          purpose?: string | null
          ref?: string
          school_code?: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_name?: string
          tsid?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "payments_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
        ]
      }
      request_letters: {
        Row: {
          addressee: string | null
          approved_at: string | null
          reason: string | null
          ref: string
          requested_at: string
          school_code: string
          school_name: string
          status: Database["public"]["Enums"]["letter_status"]
          student_name: string
          tsid: string
          type: string
          urgency: Database["public"]["Enums"]["letter_urgency"] | null
        }
        Insert: {
          addressee?: string | null
          approved_at?: string | null
          reason?: string | null
          ref?: string
          requested_at?: string
          school_code: string
          school_name: string
          status?: Database["public"]["Enums"]["letter_status"]
          student_name: string
          tsid: string
          type: string
          urgency?: Database["public"]["Enums"]["letter_urgency"] | null
        }
        Update: {
          addressee?: string | null
          approved_at?: string | null
          reason?: string | null
          ref?: string
          requested_at?: string
          school_code?: string
          school_name?: string
          status?: Database["public"]["Enums"]["letter_status"]
          student_name?: string
          tsid?: string
          type?: string
          urgency?: Database["public"]["Enums"]["letter_urgency"] | null
        }
        Relationships: [
          {
            foreignKeyName: "request_letters_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "request_letters_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "request_letters_tsid_fkey"
            columns: ["tsid"]
            isOneToOne: false
            referencedRelation: "public_student_search"
            referencedColumns: ["tsid"]
          },
          {
            foreignKeyName: "request_letters_tsid_fkey"
            columns: ["tsid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["tsid"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          code: string
          contact: string | null
          created_at: string
          district: string
          email: string | null
          name: string
          password: string
          region: string
          status: Database["public"]["Enums"]["account_status"]
          type: Database["public"]["Enums"]["school_type"]
          updated_at: string
          username: string
          ward: string
        }
        Insert: {
          address?: string | null
          code: string
          contact?: string | null
          created_at?: string
          district: string
          email?: string | null
          name: string
          password: string
          region: string
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
          username: string
          ward: string
        }
        Update: {
          address?: string | null
          code?: string
          contact?: string | null
          created_at?: string
          district?: string
          email?: string | null
          name?: string
          password?: string
          region?: string
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
          username?: string
          ward?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          blood_group: string | null
          created_at: string
          cred_password: string
          cred_username: string
          district: string
          dob: string | null
          enrollment_date: string | null
          fullname: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          issue_date: string | null
          level: string
          nationality: string | null
          parent_name: string | null
          parent_nida: string | null
          parent_phone: string | null
          photo: string | null
          region: string
          relationship: string | null
          remarks: Json
          school_code: string
          school_contact: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["account_status"]
          tsid: string
          updated_at: string
          ward: string
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          cred_password: string
          cred_username: string
          district: string
          dob?: string | null
          enrollment_date?: string | null
          fullname: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          issue_date?: string | null
          level: string
          nationality?: string | null
          parent_name?: string | null
          parent_nida?: string | null
          parent_phone?: string | null
          photo?: string | null
          region: string
          relationship?: string | null
          remarks?: Json
          school_code: string
          school_contact?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tsid?: string
          updated_at?: string
          ward: string
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          cred_password?: string
          cred_username?: string
          district?: string
          dob?: string | null
          enrollment_date?: string | null
          fullname?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          issue_date?: string | null
          level?: string
          nationality?: string | null
          parent_name?: string | null
          parent_nida?: string | null
          parent_phone?: string | null
          photo?: string | null
          region?: string
          relationship?: string | null
          remarks?: Json
          school_code?: string
          school_contact?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tsid?: string
          updated_at?: string
          ward?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "students_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      public_school_search: {
        Row: {
          code: string | null
          created_at: string | null
          district: string | null
          email: string | null
          name: string | null
          region: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          total_students: number | null
          type: Database["public"]["Enums"]["school_type"] | null
          ward: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          name?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          total_students?: never
          type?: Database["public"]["Enums"]["school_type"] | null
          ward?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          name?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          total_students?: never
          type?: Database["public"]["Enums"]["school_type"] | null
          ward?: string | null
        }
        Relationships: []
      }
      public_student_search: {
        Row: {
          created_at: string | null
          district: string | null
          fullname: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          issue_date: string | null
          level: string | null
          nationality: string | null
          region: string | null
          school_code: string | null
          school_name: string | null
          school_official_name: string | null
          school_region: string | null
          school_type: Database["public"]["Enums"]["school_type"] | null
          status: Database["public"]["Enums"]["account_status"] | null
          tsid: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "public_school_search"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "students_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      get_user_profile: {
        Args: never
        Returns: {
          email: string
          name: string
          ref: string
          role: string
          user_id: string
        }[]
      }
      hash_password: { Args: { plain_text: string }; Returns: string }
    }
    Enums: {
      account_status: "active" | "inactive" | "suspended"
      app_status: "pending" | "approved" | "rejected"
      application_status: "pending" | "approved" | "rejected"
      gender_type: "Male" | "Female"
      letter_status: "pending" | "approved" | "rejected" | "issued"
      letter_urgency: "normal" | "urgent" | "very_urgent"
      payment_method:
        | "M-Pesa"
        | "Tigo Pesa"
        | "Airtel Money"
        | "Bank Transfer"
        | "Cash"
        | "Halopesa"
        | "AzamPay"
      payment_status: "pending" | "paid" | "failed" | "cancelled"
      school_type:
        | "Primary School"
        | "Secondary School"
        | "University / College"
        | "Vocational Training"
        | "Special Needs School"
      user_role: "admin" | "gov" | "school" | "student"
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
      account_status: ["active", "inactive", "suspended"],
      app_status: ["pending", "approved", "rejected"],
      application_status: ["pending", "approved", "rejected"],
      gender_type: ["Male", "Female"],
      letter_status: ["pending", "approved", "rejected", "issued"],
      letter_urgency: ["normal", "urgent", "very_urgent"],
      payment_method: [
        "M-Pesa",
        "Tigo Pesa",
        "Airtel Money",
        "Bank Transfer",
        "Cash",
        "Halopesa",
        "AzamPay",
      ],
      payment_status: ["pending", "paid", "failed", "cancelled"],
      school_type: [
        "Primary School",
        "Secondary School",
        "University / College",
        "Vocational Training",
        "Special Needs School",
      ],
      user_role: ["admin", "gov", "school", "student"],
    },
  },
} as const
