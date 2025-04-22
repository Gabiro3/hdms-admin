export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          address: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          code?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          hospital_id: string | null
          last_login: string | null
          expertise: string | null
          is_verified: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          hospital_id?: string | null
          last_login?: string | null
          expertise?: string | null
          is_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          hospital_id?: string | null
          last_login?: string | null
          expertise?: string | null
          is_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      diagnoses: {
        Row: {
          id: string
          title: string
          doctor_notes: string | null
          ai_analysis_results: Json | null
          image_links: string[] | null
          user_id: string
          hospital_id: string
          patient_id: string
          patient_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          doctor_notes?: string | null
          ai_analysis_results?: Json | null
          image_links?: string[] | null
          user_id: string
          hospital_id: string
          patient_id: string
          patient_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          doctor_notes?: string | null
          ai_analysis_results?: Json | null
          image_links?: string[] | null
          user_id?: string
          hospital_id?: string
          patient_id?: string
          patient_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      failed_login_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string | null
          attempt_time: string
        }
        Insert: {
          id?: string
          email: string
          ip_address?: string | null
          attempt_time?: string
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string | null
          attempt_time?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          subject: string
          message: string
          status: string
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          subject: string
          message: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          subject?: string
          message?: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
