export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          barber_id: string
          commission_rate: number
          created_at: string
          id: string
          payment_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barber_id: string
          commission_rate: number
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barber_id?: string
          commission_rate?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_commissions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      instructors: {
        Row: {
          active: boolean | null
          availability: Json | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          id: string
          profile_id: string
          specialties: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          id?: string
          profile_id: string
          specialties?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          id?: string
          profile_id?: string
          specialties?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      painel_agendamentos: {
        Row: {
          barbeiro_id: string
          cliente_id: string
          created_at: string
          data: string
          hora: string
          id: string
          servico_id: string
          status: string
          updated_at: string
        }
        Insert: {
          barbeiro_id: string
          cliente_id: string
          created_at?: string
          data: string
          hora: string
          id?: string
          servico_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          barbeiro_id?: string
          cliente_id?: string
          created_at?: string
          data?: string
          hora?: string
          id?: string
          servico_id?: string
          status?: string
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
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      painel_clientes: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          senha_hash: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          senha_hash: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          senha_hash?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      painel_servicos: {
        Row: {
          created_at: string
          duracao: number
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duracao: number
          id?: string
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duracao?: number
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
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
          role: string | null
          specialties: string | null
          updated_at: string | null
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
          role?: string | null
          specialties?: string | null
          updated_at?: string | null
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
          role?: string | null
          specialties?: string | null
          updated_at?: string | null
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
      student_communications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          message_type: string
          read_at: string | null
          sender_id: string | null
          sent_at: string | null
          status: string | null
          student_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          message_type: string
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_communications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean | null
          birth_date: string | null
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          active?: boolean | null
          birth_date?: string | null
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          active?: boolean | null
          birth_date?: string | null
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          social_media: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          social_media?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          social_media?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      [_ in never]: never
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
      check_appointment_conflict: {
        Args: {
          p_staff_id: string
          p_start_time: string
          p_end_time: string
          p_exclude_appointment_id?: string
        }
        Returns: boolean
      }
      check_barber_availability: {
        Args: {
          p_barber_id: string
          p_date: string
          p_start_time: string
          p_duration_minutes: number
        }
        Returns: boolean
      }
      check_client_appointment_conflict: {
        Args: {
          p_client_id: string
          p_start_time: string
          p_end_time: string
          p_exclude_appointment_id?: string
        }
        Returns: boolean
      }
      check_time_slot_availability: {
        Args: {
          p_staff_id: string
          p_date: string
          p_start_time: string
          p_duration: number
        }
        Returns: boolean
      }
      clean_expired_client_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_barbers: {
        Args: {
          p_service_id: string
          p_date: string
          p_time: string
          p_duration: number
        }
        Returns: {
          id: string
          name: string
          email: string
          phone: string
          image_url: string
          specialties: string
          experience: string
          role: string
          is_active: boolean
        }[]
      }
      get_available_time_slots: {
        Args: { p_staff_id: string; p_date: string; p_service_duration: number }
        Returns: {
          time_slot: string
        }[]
      }
      get_birthday_clients: {
        Args: { target_month?: number }
        Returns: {
          id: string
          name: string
          email: string
          phone: string
          birth_date: string
          whatsapp: string
          age: number
        }[]
      }
      get_staff_module_access: {
        Args: { staff_id_param: string }
        Returns: string[]
      }
      has_role: {
        Args:
          | { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
          | { role_name: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_staff_member: {
        Args: { user_email: string }
        Returns: boolean
      }
      update_staff_module_access: {
        Args: { staff_id_param: string; module_ids_param: string[] }
        Returns: undefined
      }
      validate_appointment_booking: {
        Args: {
          p_client_id: string
          p_staff_id: string
          p_service_id: string
          p_start_time: string
          p_end_time: string
        }
        Returns: Json
      }
      validate_client_age: {
        Args: { birth_date: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "barber" | "customer" | "manager"
      user_type: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "barber", "customer", "manager"],
      user_type: ["admin", "user"],
    },
  },
} as const
