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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_metrics: {
        Row: {
          created_at: string
          date_recorded: string
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_coupons: {
        Row: {
          applied_at: string
          appointment_id: string
          coupon_id: string
          discount_amount: number
          id: string
        }
        Insert: {
          applied_at?: string
          appointment_id: string
          coupon_id: string
          discount_amount: number
          id?: string
        }
        Update: {
          applied_at?: string
          appointment_id?: string
          coupon_id?: string
          discount_amount?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_coupons_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_extra_services: {
        Row: {
          added_at: string | null
          added_by: string | null
          appointment_id: string | null
          id: string
          service_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          appointment_id?: string | null
          id?: string
          service_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          appointment_id?: string | null
          id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_extra_services_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_extra_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_extra_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "appointment_extra_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "painel_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_history: {
        Row: {
          action: string
          appointment_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          appointment_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          appointment_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_ratings: {
        Row: {
          appointment_id: string
          barber_id: string
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          barber_id: string
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          barber_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "appointment_ratings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          coupon_code: string | null
          created_at: string | null
          discount_amount: number | null
          end_time: string
          id: string
          notes: string | null
          service_id: string
          staff_id: string | null
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coupon_code?: string | null
          created_at?: string | null
          discount_amount?: number | null
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          staff_id?: string | null
          start_time: string
          status: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coupon_code?: string | null
          created_at?: string | null
          discount_amount?: number | null
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          staff_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      banner_images: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          subtitle: string
          title: string
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          subtitle: string
          title: string
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      barber_audit_log: {
        Row: {
          action: string
          barber_id: string | null
          description: string | null
          id: string
          performed_by: string | null
          timestamp: string | null
        }
        Insert: {
          action: string
          barber_id?: string | null
          description?: string | null
          id?: string
          performed_by?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string
          barber_id?: string | null
          description?: string | null
          id?: string
          performed_by?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_audit_log_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_2"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_availability: {
        Row: {
          barber_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean
          reason: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean
          reason?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          reason?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_availability_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_commissions: {
        Row: {
          amount: number
          appointment_id: string | null
          appointment_source: string | null
          barber_id: string
          commission_rate: number
          commission_type: string | null
          created_at: string
          id: string
          item_name: string | null
          payment_date: string | null
          product_sale_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          appointment_source?: string | null
          barber_id: string
          commission_rate: number
          commission_type?: string | null
          created_at?: string
          id?: string
          item_name?: string | null
          payment_date?: string | null
          product_sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          appointment_source?: string | null
          barber_id?: string
          commission_rate?: number
          commission_type?: string | null
          created_at?: string
          id?: string
          item_name?: string | null
          payment_date?: string | null
          product_sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_commissions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_commissions_product_sale_id_fkey"
            columns: ["product_sale_id"]
            isOneToOne: false
            referencedRelation: "totem_product_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_schedules: {
        Row: {
          barber_id: string | null
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          weekday: number | null
        }
        Insert: {
          barber_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          weekday?: number | null
        }
        Update: {
          barber_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_schedules_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      barbers_2: {
        Row: {
          created_at: string | null
          id: string
          staff_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          staff_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          staff_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbers_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: string
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_flow: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_flow_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_register_sessions: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          created_at: string
          date: string
          id: string
          opened_at: string
          opening_balance: number
          status: string
          total_commissions: number
          total_expenses: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          date: string
          id?: string
          opened_at: string
          opening_balance?: number
          status?: string
          total_commissions?: number
          total_expenses?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          date?: string
          id?: string
          opened_at?: string
          opening_balance?: number
          status?: string
          total_commissions?: number
          total_expenses?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: []
      }
      class_bookings: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          status: string
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          status?: string
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          class_type_id: string | null
          created_at: string
          current_attendance: number | null
          description: string | null
          end_time: string
          id: string
          instructor_id: string | null
          max_capacity: number
          room: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          class_type_id?: string | null
          created_at?: string
          current_attendance?: number | null
          description?: string | null
          end_time: string
          id?: string
          instructor_id?: string | null
          max_capacity: number
          room: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          class_type_id?: string | null
          created_at?: string
          current_attendance?: number | null
          description?: string | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          max_capacity?: number
          room?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          appointment_id: string | null
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          rating: number
          service_id: string | null
          staff_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          rating: number
          service_id?: string | null
          staff_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          rating?: number
          service_id?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sessions: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          last_used_at: string | null
          token_hash: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          last_used_at?: string | null
          token_hash: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          last_used_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          email_verification_expires: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          id: string
          name: string
          password_hash: string | null
          phone: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          email_verification_expires?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          id?: string
          name: string
          password_hash?: string | null
          phone: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          email_verification_expires?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          id?: string
          name?: string
          password_hash?: string | null
          phone?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          agendamento_id: string
          barbeiro_id: string
          created_at: string
          data: string
          id: string
          percentual: number
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          agendamento_id: string
          barbeiro_id: string
          created_at?: string
          data?: string
          id?: string
          percentual: number
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          agendamento_id?: string
          barbeiro_id?: string
          created_at?: string
          data?: string
          id?: string
          percentual?: number
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "comissoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_backups: {
        Row: {
          backup_data: Json
          backup_name: string
          backup_type: string | null
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          backup_data: Json
          backup_name: string
          backup_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          backup_data?: Json
          backup_name?: string
          backup_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coverage_areas: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean | null
          postal_code: string | null
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          postal_code?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          postal_code?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          additional_data: Json | null
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          period_date: string
          period_type: string | null
          updated_at: string
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value?: number
          period_date?: string
          period_type?: string | null
          updated_at?: string
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          period_date?: string
          period_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_active: boolean | null
          position_x: number | null
          position_y: number | null
          updated_at: string
          user_id: string | null
          widget_config: Json
          widget_name: string
          widget_type: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          user_id?: string | null
          widget_config: Json
          widget_name: string
          widget_type: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          user_id?: string | null
          widget_config?: Json
          widget_name?: string
          widget_type?: string
          width?: number | null
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          campaign_id: string | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          campaign_id?: string | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          campaign_id?: string | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_coupons_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          commission_rate: number | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          phone: string
          photo_url: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          phone: string
          photo_url?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          phone?: string
          photo_url?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string | null
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id?: string | null
          categoria?: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          barbeiro_id?: string | null
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "finance_transactions_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          category: string
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string
          discount_amount: number | null
          due_date: string | null
          gross_amount: number
          id: string
          metadata: Json | null
          net_amount: number
          notes: string | null
          payment_date: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          subcategory: string | null
          tax_amount: number | null
          transaction_date: string
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          category: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          discount_amount?: number | null
          due_date?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json | null
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subcategory?: string | null
          tax_amount?: number | null
          transaction_date?: string
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          category?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          discount_amount?: number | null
          due_date?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json | null
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subcategory?: string | null
          tax_amount?: number | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "financial_records_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status: string
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          created_at: string
          id: string
          pago_em: string | null
          recorrente: boolean
          tipo: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          id?: string
          pago_em?: string | null
          recorrente?: boolean
          tipo: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          id?: string
          pago_em?: string | null
          recorrente?: boolean
          tipo?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      food_analysis: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          fiber: number | null
          food_name: string
          health_score: number | null
          id: string
          image_url: string | null
          protein: number
          serving_size: string | null
          sodium: number | null
          sugar: number | null
          user_id: string | null
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          fat: number
          fiber?: number | null
          food_name: string
          health_score?: number | null
          id?: string
          image_url?: string | null
          protein: number
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number | null
          food_name?: string
          health_score?: number | null
          id?: string
          image_url?: string | null
          protein?: number
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          src: string
          updated_at: string | null
        }
        Insert: {
          alt: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          src: string
          updated_at?: string | null
        }
        Update: {
          alt?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          src?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          alt_text: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_error_logs: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          last_retry_at: string | null
          max_retries: number | null
          resolved_at: string | null
          retry_count: number | null
          session_id: string | null
          stack_trace: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          resolved_at?: string | null
          retry_count?: number | null
          session_id?: string | null
          stack_trace?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          resolved_at?: string | null
          retry_count?: number | null
          session_id?: string | null
          stack_trace?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_roles: {
        Row: {
          created_at: string | null
          department: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      navigation_menu: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          parent_id: string | null
          permission_required: string | null
          target: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          parent_id?: string | null
          permission_required?: string | null
          target?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          parent_id?: string | null
          permission_required?: string | null
          target?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_menu_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_menu"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          appointment_id: string
          client_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "notification_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          read: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          read?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          read?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          atualizado_em: string | null
          copia_cola: string | null
          criado_em: string | null
          id: string
          metodo: string
          payload: Json | null
          provedor: string | null
          qr_code: string | null
          status: string
          transacao_id: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          copia_cola?: string | null
          criado_em?: string | null
          id?: string
          metodo: string
          payload?: Json | null
          provedor?: string | null
          qr_code?: string | null
          status?: string
          transacao_id?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          copia_cola?: string | null
          criado_em?: string | null
          id?: string
          metodo?: string
          payload?: Json | null
          provedor?: string | null
          qr_code?: string | null
          status?: string
          transacao_id?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["venda_id"]
          },
          {
            foreignKeyName: "pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vw_vendas_abertas"
            referencedColumns: ["venda_id"]
          },
        ]
      }
      painel_agendamentos: {
        Row: {
          barbeiro_id: string
          cliente_id: string
          created_at: string
          data: string
          hora: string
          id: string
          qr_checkin: string | null
          servico_id: string
          status: string
          status_totem: Database["public"]["Enums"]["status_agendamento"] | null
          updated_at: string
        }
        Insert: {
          barbeiro_id: string
          cliente_id: string
          created_at?: string
          data: string
          hora: string
          id?: string
          qr_checkin?: string | null
          servico_id: string
          status?: string
          status_totem?:
            | Database["public"]["Enums"]["status_agendamento"]
            | null
          updated_at?: string
        }
        Update: {
          barbeiro_id?: string
          cliente_id?: string
          created_at?: string
          data?: string
          hora?: string
          id?: string
          qr_checkin?: string | null
          servico_id?: string
          status?: string
          status_totem?:
            | Database["public"]["Enums"]["status_agendamento"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "painel_agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "painel_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      painel_barbeiros: {
        Row: {
          commission_rate: number | null
          created_at: string
          email: string | null
          experience: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          nome: string
          role: string | null
          specialties: string | null
          staff_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          nome: string
          role?: string | null
          specialties?: string | null
          staff_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          nome?: string
          role?: string | null
          specialties?: string | null
          staff_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_painel_barbeiros_staff"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      painel_clientes: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email: string
          id?: string
          nome: string
          senha_hash: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string
          id?: string
          nome?: string
          senha_hash?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      painel_produtos: {
        Row: {
          categoria: string
          commission_percentage: number | null
          commission_value: number | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          estoque: number
          estoque_minimo: number | null
          id: string
          imagens: Json | null
          is_active: boolean | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          categoria?: string
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number
          estoque_minimo?: number | null
          id?: string
          imagens?: Json | null
          is_active?: boolean | null
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number
          estoque_minimo?: number | null
          id?: string
          imagens?: Json | null
          is_active?: boolean | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      painel_servicos: {
        Row: {
          created_at: string
          descricao: string | null
          display_order: number | null
          duracao: number
          id: string
          imagem_url: string | null
          is_active: boolean | null
          nome: string
          preco: number
          show_on_home: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          display_order?: number | null
          duracao: number
          id?: string
          imagem_url?: string | null
          is_active?: boolean | null
          nome: string
          preco: number
          show_on_home?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          display_order?: number | null
          duracao?: number
          id?: string
          imagem_url?: string | null
          is_active?: boolean | null
          nome?: string
          preco?: number
          show_on_home?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          authorization_code: string | null
          confirmed_at: string | null
          created_at: string | null
          financial_record_id: string
          id: string
          metadata: Json | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          pix_key: string | null
          pix_qr_code: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          financial_record_id: string
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          pix_key?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          financial_record_id?: string
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string
          pix_key?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "financial_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string
          status: string
          student_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_types: {
        Row: {
          class_limit: number | null
          created_at: string | null
          description: string | null
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          class_limit?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          class_limit?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_category_relations: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          estoque: number | null
          id: string
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          estoque?: number | null
          id?: string
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          estoque?: number | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string | null
          full_name: string
          gender: string | null
          height: number | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          weight: number | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          full_name: string
          gender?: string | null
          height?: number | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          weight?: number | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          gender?: string | null
          height?: number | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          weight?: number | null
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          subscription_data: Json
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          subscription_data: Json
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          subscription_data?: Json
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          created_by: string | null
          cuisine_type: string | null
          health_score: number | null
          id: string
          ingredients: Json
          instructions: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          health_score?: number | null
          id?: string
          ingredients: Json
          instructions: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          health_score?: number | null
          id?: string
          ingredients?: Json
          instructions?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_run: string | null
          next_run: string | null
          parameters: Json | null
          schedule_cron: string
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          parameters?: Json | null
          schedule_cron: string
          task_name: string
          task_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          parameters?: Json | null
          schedule_cron?: string
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_id_mapping: {
        Row: {
          created_at: string | null
          painel_servicos_id: string
          services_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          painel_servicos_id: string
          services_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          painel_servicos_id?: string
          services_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_id_mapping_painel_servicos_id_fkey"
            columns: ["painel_servicos_id"]
            isOneToOne: false
            referencedRelation: "painel_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_id_mapping_services_id_fkey"
            columns: ["services_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_staff: {
        Row: {
          created_at: string
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_staff_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "painel_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          shop_name: string
          social_facebook: string | null
          social_instagram: string | null
          social_twitter: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          shop_name: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          shop_name?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      special_dates: {
        Row: {
          created_at: string | null
          date: string
          description: string
          id: string
          is_holiday: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id?: string
          is_holiday?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_holiday?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string | null
          experience: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          requires_password_change: boolean | null
          role: string | null
          specialties: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          requires_password_change?: boolean | null
          role?: string | null
          specialties?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          requires_password_change?: boolean | null
          role?: string | null
          specialties?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_module_access: {
        Row: {
          created_at: string
          id: string
          module_id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_module_access_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string
          id: string
          priority: string
          staff_id: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority: string
          staff_id?: string | null
          status: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string
          staff_id?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tef_mock_transactions: {
        Row: {
          amount: number
          authorization_code: string | null
          callback_url: string | null
          card_brand: string | null
          created_at: string
          id: string
          installments: number | null
          nsu: string | null
          payment_id: string
          payment_type: string
          reference: string | null
          simulated_at: string | null
          soft_descriptor: string | null
          status: string
          terminal_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          callback_url?: string | null
          card_brand?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          nsu?: string | null
          payment_id: string
          payment_type: string
          reference?: string | null
          simulated_at?: string | null
          soft_descriptor?: string | null
          status?: string
          terminal_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          callback_url?: string | null
          card_brand?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          nsu?: string | null
          payment_id?: string
          payment_type?: string
          reference?: string | null
          simulated_at?: string | null
          soft_descriptor?: string | null
          status?: string
          terminal_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tef_settings: {
        Row: {
          api_key: string | null
          api_url: string | null
          created_at: string
          id: string
          terminal_id: string | null
          timeout_seconds: number | null
          updated_at: string
          use_mock: boolean
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          terminal_id?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          use_mock?: boolean
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          terminal_id?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          use_mock?: boolean
          webhook_url?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          rating: number | null
          role: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string | null
          id: string
          responder_id: string | null
          responder_type: string
          response_text: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          responder_id?: string | null
          responder_type: string
          response_text: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          responder_id?: string | null
          responder_type?: string
          response_text?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          staff_id: string | null
          start_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          staff_id?: string | null
          start_date: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          staff_id?: string | null
          start_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_auth: {
        Row: {
          created_at: string
          device_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      totem_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string
          pix_key: string | null
          pix_qr_code: string | null
          session_id: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method: string
          pix_key?: string | null
          pix_qr_code?: string | null
          session_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string
          pix_key?: string | null
          pix_qr_code?: string | null
          session_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "totem_payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "totem_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_product_sale_items: {
        Row: {
          created_at: string | null
          id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          sale_id: string | null
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          sale_id?: string | null
          subtotal: number
        }
        Update: {
          created_at?: string | null
          id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          sale_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "totem_product_sale_items_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "painel_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "totem_product_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "totem_product_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_product_sales: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          pix_key: string | null
          pix_qr_code: string | null
          total: number
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          pix_key?: string | null
          pix_qr_code?: string | null
          total: number
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          pix_key?: string | null
          pix_qr_code?: string | null
          total?: number
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "totem_product_sales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_sessions: {
        Row: {
          appointment_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "totem_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "totem_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string | null
          discount: number | null
          financial_record_id: string
          id: string
          item_id: string
          item_name: string
          item_type: string
          metadata: Json | null
          quantity: number
          source_table: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          financial_record_id: string
          id?: string
          item_id: string
          item_name: string
          item_type: string
          metadata?: Json | null
          quantity?: number
          source_table?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          financial_record_id?: string
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          metadata?: Json | null
          quantity?: number
          source_table?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "financial_records"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vendas: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string | null
          cliente_id: string | null
          criado_em: string | null
          desconto: number
          id: string
          status: string
          subtotal: number
          total: number
          totem_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          desconto?: number
          id?: string
          status?: string
          subtotal?: number
          total?: number
          totem_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string | null
          barbeiro_id?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          desconto?: number
          id?: string
          status?: string
          subtotal?: number
          total?: number
          totem_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "vendas_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_totem_session_id_fkey"
            columns: ["totem_session_id"]
            isOneToOne: false
            referencedRelation: "totem_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_itens: {
        Row: {
          criado_em: string | null
          id: string
          nome: string
          preco_unit: number
          quantidade: number
          ref_id: string
          tipo: string
          total: number
          venda_id: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome: string
          preco_unit: number
          quantidade?: number
          ref_id: string
          tipo: string
          total: number
          venda_id?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome?: string
          preco_unit?: number
          quantidade?: number
          ref_id?: string
          tipo?: string
          total?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["venda_id"]
          },
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vw_vendas_abertas"
            referencedColumns: ["venda_id"]
          },
        ]
      }
      working_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          staff_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          staff_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          staff_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      commission_report: {
        Row: {
          average_rate: number | null
          barber_email: string | null
          barber_id: string | null
          barber_name: string | null
          period: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          total_commission: number | null
          total_services: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_dashboard: {
        Row: {
          average_amount: number | null
          category: string | null
          period: string | null
          total_amount: number | null
          transaction_count: number | null
          transaction_type:
            | Database["public"]["Enums"]["transaction_type"]
            | null
        }
        Relationships: []
      }
      vw_agendamentos_sem_financeiro: {
        Row: {
          agendamento_data: string | null
          agendamento_hora: string | null
          agendamento_id: string | null
          barbeiro_id: string | null
          barbeiro_nome: string | null
          cliente_id: string | null
          cliente_nome: string | null
          minutos_desde_finalizacao: number | null
          registros_financeiros_count: number | null
          status: string | null
          status_totem: Database["public"]["Enums"]["status_agendamento"] | null
          updated_at: string | null
          venda_id: string | null
          venda_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_barber_commissions_complete: {
        Row: {
          amount: number | null
          appointment_date: string | null
          appointment_id: string | null
          appointment_source: string | null
          appointment_time: string | null
          barber_id: string | null
          client_name: string | null
          commission_rate: number | null
          created_at: string | null
          id: string | null
          payment_date: string | null
          service_name: string | null
          service_price: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_commissions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_vendas_abertas: {
        Row: {
          agendamento_id: string | null
          check_in_time: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_whatsapp: string | null
          horas_aberta: number | null
          sessao_status: string | null
          tipo_venda: string | null
          total: number | null
          totem_session_id: string | null
          updated_at: string | null
          venda_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "painel_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "vw_agendamentos_sem_financeiro"
            referencedColumns: ["agendamento_id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_totem_session_id_fkey"
            columns: ["totem_session_id"]
            isOneToOne: false
            referencedRelation: "totem_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_barber_user: {
        Args: { p_email: string; p_name: string; p_role?: string }
        Returns: string
      }
      apply_coupon_to_appointment: {
        Args: { p_appointment_id: string; p_coupon_code: string }
        Returns: Json
      }
      authenticate_painel_cliente: {
        Args: { email: string; senha_hash: string }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_appointment_conflict: {
        Args: {
          p_end_time: string
          p_exclude_appointment_id?: string
          p_staff_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      check_barber_auth_exists: { Args: { p_email: string }; Returns: boolean }
      check_client_appointment_conflict: {
        Args: {
          p_client_id: string
          p_end_time: string
          p_exclude_appointment_id?: string
          p_start_time: string
        }
        Returns: boolean
      }
      check_new_barber_availability: {
        Args: {
          p_barber_id: string
          p_date: string
          p_duration_minutes: number
          p_time: string
        }
        Returns: boolean
      }
      check_painel_cliente_email: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      check_time_slot_availability: {
        Args: {
          p_date: string
          p_duration: number
          p_staff_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      check_unified_slot_availability: {
        Args: {
          p_date: string
          p_duration_minutes: number
          p_exclude_appointment_id?: string
          p_staff_id: string
          p_time: string
        }
        Returns: boolean
      }
      clean_expired_client_sessions: { Args: never; Returns: undefined }
      create_admin_manager_user: {
        Args: {
          p_email: string
          p_employee_id: string
          p_password: string
          p_role: string
        }
        Returns: Json
      }
      create_barber_auth_user: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_staff_id: string
        }
        Returns: Json
      }
      create_painel_agendamento: {
        Args: {
          barbeiro_id: string
          cliente_id: string
          data: string
          hora: string
          servico_id: string
        }
        Returns: {
          barbeiro_id: string
          cliente_id: string
          created_at: string
          data: string
          hora: string
          id: string
          qr_checkin: string | null
          servico_id: string
          status: string
          status_totem: Database["public"]["Enums"]["status_agendamento"] | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_agendamentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_painel_cliente: {
        Args: {
          email: string
          nome: string
          senha_hash: string
          whatsapp: string
        }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_painel_cliente_with_birth_date: {
        Args: {
          data_nascimento: string
          email: string
          nome: string
          senha_hash: string
          whatsapp: string
        }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decrease_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      disable_barber_auth_user: { Args: { p_email: string }; Returns: Json }
      generate_payment_number: { Args: never; Returns: string }
      generate_qr_checkin: {
        Args: { p_agendamento_id: string; p_secret: string }
        Returns: string
      }
      generate_transaction_number: { Args: never; Returns: string }
      get_admin_manager_details: {
        Args: never
        Returns: {
          created_at: string
          email: string
          employee_id: string
          has_access: boolean
          last_login: string
          name: string
          role: string
          status: string
          user_id: string
        }[]
      }
      get_agendamentos_barbeiro_data: {
        Args: { barbeiro_id: string; data_agendamento: string }
        Returns: {
          hora: string
          id: string
          status: string
        }[]
      }
      get_available_barbers: {
        Args: {
          p_date: string
          p_duration: number
          p_service_id: string
          p_time: string
        }
        Returns: {
          email: string
          experience: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          phone: string
          role: string
          specialties: string
        }[]
      }
      get_available_slots: {
        Args: { p_barbeiro_id: string; p_data: string; p_duracao?: number }
        Returns: {
          disponivel: boolean
          hora: string
        }[]
      }
      get_available_time_slots: {
        Args: { p_date: string; p_service_duration: number; p_staff_id: string }
        Returns: {
          time_slot: string
        }[]
      }
      get_available_time_slots_optimized: {
        Args: { p_date: string; p_service_duration: number; p_staff_id: string }
        Returns: {
          is_available: boolean
          time_slot: string
        }[]
      }
      get_barbeiro_horarios_disponiveis: {
        Args: {
          p_barbeiro_id: string
          p_data: string
          p_duracao_minutos?: number
        }
        Returns: {
          disponivel: boolean
          horario: string
        }[]
      }
      get_birthday_clients: {
        Args: { target_month?: number }
        Returns: {
          age: number
          birth_date: string
          email: string
          id: string
          name: string
          phone: string
          whatsapp: string
        }[]
      }
      get_painel_barbeiros: {
        Args: never
        Returns: {
          commission_rate: number | null
          created_at: string
          email: string | null
          experience: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          nome: string
          role: string | null
          specialties: string | null
          staff_id: string | null
          telefone: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "painel_barbeiros"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_painel_cliente_by_id: {
        Args: { cliente_id: string }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_painel_servicos: {
        Args: never
        Returns: {
          created_at: string
          descricao: string | null
          display_order: number | null
          duracao: number
          id: string
          imagem_url: string | null
          is_active: boolean | null
          nome: string
          preco: number
          show_on_home: boolean | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "painel_servicos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_staff_module_access: {
        Args: { staff_id_param: string }
        Returns: string[]
      }
      has_module_access: {
        Args: { _module_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { role: Database["public"]["Enums"]["app_role"]; user_id: string }
        Returns: boolean
      }
      increment_retry_count: {
        Args: { p_error_log_id: string }
        Returns: undefined
      }
      insert_painel_agendamento: {
        Args: {
          p_barbeiro_id: string
          p_cliente_id: string
          p_data: string
          p_hora: string
          p_servico_id: string
          p_status?: string
        }
        Returns: string
      }
      is_admin:
        | { Args: { user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_barber: { Args: { user_id?: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      is_staff_member: { Args: { user_email: string }; Returns: boolean }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      is_user_staff: { Args: { user_id: string }; Returns: boolean }
      mark_error_resolved: {
        Args: { p_error_log_id: string }
        Returns: undefined
      }
      reprocess_failed_appointment: {
        Args: { p_agendamento_id: string }
        Returns: Json
      }
      revoke_admin_manager_access: {
        Args: { p_employee_id: string }
        Returns: Json
      }
      update_agendamento_status_totem: {
        Args: {
          p_agendamento_id: string
          p_status: string
          p_status_totem: string
        }
        Returns: undefined
      }
      update_painel_cliente: {
        Args: {
          cliente_id: string
          email?: string
          nome?: string
          whatsapp?: string
        }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_painel_cliente_with_birth_date: {
        Args: {
          cliente_id: string
          data_nascimento?: string
          email?: string
          nome?: string
          whatsapp?: string
        }
        Returns: {
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "painel_clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_staff_module_access: {
        Args: { module_ids_param: string[]; staff_id_param: string }
        Returns: undefined
      }
      validate_appointment_booking: {
        Args: {
          p_client_id: string
          p_end_time: string
          p_service_id: string
          p_staff_id: string
          p_start_time: string
        }
        Returns: Json
      }
      validate_client_age: { Args: { birth_date: string }; Returns: boolean }
      validate_qr_checkin: {
        Args: { p_qr_token: string; p_secret: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "barber" | "customer" | "manager" | "master"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "pix"
        | "bank_transfer"
      payment_status:
        | "pending"
        | "processing"
        | "paid"
        | "partially_paid"
        | "refunded"
        | "cancelled"
      status_agendamento:
        | "AGENDADO"
        | "CHEGOU"
        | "EM_ATENDIMENTO"
        | "FINALIZADO"
        | "CANCELADO"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "failed"
      transaction_type:
        | "revenue"
        | "expense"
        | "commission"
        | "refund"
        | "adjustment"
      user_type: "admin" | "user"
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
      app_role: ["admin", "user", "barber", "customer", "manager", "master"],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "pix",
        "bank_transfer",
      ],
      payment_status: [
        "pending",
        "processing",
        "paid",
        "partially_paid",
        "refunded",
        "cancelled",
      ],
      status_agendamento: [
        "AGENDADO",
        "CHEGOU",
        "EM_ATENDIMENTO",
        "FINALIZADO",
        "CANCELADO",
      ],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      transaction_type: [
        "revenue",
        "expense",
        "commission",
        "refund",
        "adjustment",
      ],
      user_type: ["admin", "user"],
    },
  },
} as const
