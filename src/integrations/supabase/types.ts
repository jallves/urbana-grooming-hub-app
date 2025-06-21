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
      admin_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_master_users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["admin_master_role"]
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_master_role"]
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_master_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      alimentacao_individual: {
        Row: {
          created_at: string
          data_consumo: string
          descricao: string | null
          estabelecimento: string
          id: string
          pessoa_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_consumo?: string
          descricao?: string | null
          estabelecimento: string
          id?: string
          pessoa_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_consumo?: string
          descricao?: string | null
          estabelecimento?: string
          id?: string
          pessoa_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "alimentacao_individual_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      api_configurations: {
        Row: {
          api_key: string | null
          created_at: string
          endpoint_url: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          endpoint_url: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          endpoint_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          barber_id: string | null
          barber_shop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          barber_shop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          barber_shop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_shop_id_fkey"
            columns: ["barber_shop_id"]
            isOneToOne: false
            referencedRelation: "barber_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          cta_text: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          mobile_image_url: string | null
          position: number | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_image_url?: string | null
          position?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_image_url?: string | null
          position?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      barber_admin_users: {
        Row: {
          auth_id: string | null
          barber_shop_id: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["barber_admin_role"]
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          barber_shop_id: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["barber_admin_role"]
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          barber_shop_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["barber_admin_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_barber_shop"
            columns: ["barber_shop_id"]
            isOneToOne: false
            referencedRelation: "barber_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_shops: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          description: string | null
          dominio: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          next_billing: string | null
          phone: string | null
          plano: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          dominio?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          next_billing?: string | null
          phone?: string | null
          plano?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          dominio?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          next_billing?: string | null
          phone?: string | null
          plano?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cartoes: {
        Row: {
          created_at: string
          id: string
          limite: number | null
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          limite?: number | null
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          limite?: number | null
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      carts: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias_despesas: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      child_accounts: {
        Row: {
          age: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string
          photo_url: string | null
          pin: string | null
          points: number
        }
        Insert: {
          age: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id: string
          photo_url?: string | null
          pin?: string | null
          points?: number
        }
        Update: {
          age?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string
          photo_url?: string | null
          pin?: string | null
          points?: number
        }
        Relationships: []
      }
      child_activation_tokens: {
        Row: {
          child_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_expired: boolean
          is_used: boolean
          token: string
        }
        Insert: {
          child_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean
          is_used?: boolean
          token: string
        }
        Update: {
          child_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean
          is_used?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_activation_tokens_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      child_pin_history: {
        Row: {
          child_id: string
          created_at: string
          id: string
          pin: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          pin: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          pin?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_pin_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_preferences: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          preferred_communication_channel: string | null
          receive_appointment_reminders: boolean | null
          receive_marketing_emails: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          preferred_communication_channel?: string | null
          receive_appointment_reminders?: boolean | null
          receive_marketing_emails?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          preferred_communication_channel?: string | null
          receive_appointment_reminders?: boolean | null
          receive_marketing_emails?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          auth_id: string | null
          barber_shop_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          barber_shop_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          barber_shop_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_barber_shop_id_fkey"
            columns: ["barber_shop_id"]
            isOneToOne: false
            referencedRelation: "barber_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          created_at: string
          id: string
          mind_map_id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mind_map_id: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mind_map_id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_tasks: {
        Row: {
          completed_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          feedback_rating: number | null
          full_name: string
          id: string
          message: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          feedback_rating?: number | null
          full_name: string
          id?: string
          message: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          feedback_rating?: number | null
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      dependent_links: {
        Row: {
          active: boolean
          created_at: string
          dependent_email: string
          dependent_name: string
          id: string
          owner_id: string
          token: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dependent_email: string
          dependent_name: string
          id?: string
          owner_id: string
          token: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dependent_email?: string
          dependent_name?: string
          id?: string
          owner_id?: string
          token?: string
        }
        Relationships: []
      }
      dependent_reward_redemptions: {
        Row: {
          dependent_link_id: string
          id: string
          redeemed_at: string
          reward_id: string
        }
        Insert: {
          dependent_link_id: string
          id?: string
          redeemed_at?: string
          reward_id: string
        }
        Update: {
          dependent_link_id?: string
          id?: string
          redeemed_at?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependent_reward_redemptions_dependent_link_id_fkey"
            columns: ["dependent_link_id"]
            isOneToOne: false
            referencedRelation: "dependent_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependent_reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      dependent_task_completions: {
        Row: {
          completed_at: string
          dependent_link_id: string
          id: string
          task_id: string
        }
        Insert: {
          completed_at?: string
          dependent_link_id: string
          id?: string
          task_id: string
        }
        Update: {
          completed_at?: string
          dependent_link_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependent_task_completions_dependent_link_id_fkey"
            columns: ["dependent_link_id"]
            isOneToOne: false
            referencedRelation: "dependent_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependent_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          cartao_id: string | null
          categoria_id: string
          created_at: string
          data_despesa: string
          descricao: string | null
          forma_pagamento: string
          id: string
          pessoa_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          cartao_id?: string | null
          categoria_id: string
          created_at?: string
          data_despesa?: string
          descricao?: string | null
          forma_pagamento: string
          id?: string
          pessoa_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          cartao_id?: string | null
          categoria_id?: string
          created_at?: string
          data_despesa?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          pessoa_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          description: string | null
          document_type: string
          employee_id: string | null
          file_url: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          description?: string | null
          document_type: string
          employee_id?: string | null
          file_url: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          description?: string | null
          document_type?: string
          employee_id?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_projects: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          joined_date: string | null
          project_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          joined_date?: string | null
          project_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          joined_date?: string | null
          project_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_projects_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company: string
          cpf: string
          created_at: string
          department: string | null
          full_name: string
          hire_date: string | null
          id: string
          photo_url: string | null
          position: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company: string
          cpf: string
          created_at?: string
          department?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          photo_url?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string
          cpf?: string
          created_at?: string
          department?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          photo_url?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      licencas: {
        Row: {
          chave: string
          cliente_id: string | null
          created_at: string | null
          data_emissao: string | null
          data_validade: string
          id: string
          plano_id: string | null
          status: Database["public"]["Enums"]["license_status"] | null
          updated_at: string | null
        }
        Insert: {
          chave: string
          cliente_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade: string
          id?: string
          plano_id?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          updated_at?: string | null
        }
        Update: {
          chave?: string
          cliente_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string
          id?: string
          plano_id?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "barber_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licencas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mind_maps: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          layout_type: string
          owner_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          layout_type?: string
          owner_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          layout_type?: string
          owner_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_points: {
        Row: {
          created_at: string | null
          id: string
          month: string
          points: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month?: string
          points?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          points?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          content: string
          created_at: string
          id: string
          mind_map_id: string
          order_index: number
          parent_id: string | null
          position_x: number
          position_y: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mind_map_id: string
          order_index?: number
          parent_id?: string | null
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mind_map_id?: string
          order_index?: number
          parent_id?: string | null
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_mercado: {
        Row: {
          created_at: string
          data_compra: string
          id: string
          mercado: string
          numero_nota: string
          pessoa_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_compra?: string
          id?: string
          mercado: string
          numero_nota: string
          pessoa_id: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_compra?: string
          id?: string
          mercado?: string
          numero_nota?: string
          pessoa_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_mercado_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price?: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_details: Json | null
          shipping_address: Json | null
          status: string
          total_amount: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_details?: Json | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_details?: Json | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          cotas: number
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cotas?: number
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cotas?: number
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          id: string
          nome: string
          preco: number
          recursos: Json
          tipo: Database["public"]["Enums"]["plano_type"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          nome: string
          preco: number
          recursos: Json
          tipo: Database["public"]["Enums"]["plano_type"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          nome?: string
          preco?: number
          recursos?: Json
          tipo?: Database["public"]["Enums"]["plano_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          is_new: boolean | null
          name: string
          price: number
          sales_count: number | null
          seo_tags: Json | null
          sku: string | null
          slug: string | null
          specifications: Json | null
          stock: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          name: string
          price?: number
          sales_count?: number | null
          seo_tags?: Json | null
          sku?: string | null
          slug?: string | null
          specifications?: Json | null
          stock?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          name?: string
          price?: number
          sales_count?: number | null
          seo_tags?: Json | null
          sku?: string | null
          slug?: string | null
          specifications?: Json | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          created_at: string
          difficulty_level: string | null
          id: string
          interests: string[] | null
          name: string
          notification_preferences: Json | null
          parental_controls: Json | null
          photo_url: string | null
          points: number | null
          progress_tracking: Json | null
          schedule: Json | null
          theme: string | null
        }
        Insert: {
          age: number
          created_at?: string
          difficulty_level?: string | null
          id: string
          interests?: string[] | null
          name: string
          notification_preferences?: Json | null
          parental_controls?: Json | null
          photo_url?: string | null
          points?: number | null
          progress_tracking?: Json | null
          schedule?: Json | null
          theme?: string | null
        }
        Update: {
          age?: number
          created_at?: string
          difficulty_level?: string | null
          id?: string
          interests?: string[] | null
          name?: string
          notification_preferences?: Json | null
          parental_controls?: Json | null
          photo_url?: string | null
          points?: number | null
          progress_tracking?: Json | null
          schedule?: Json | null
          theme?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          id: string
          redeemed_at: string | null
          reward_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          reward_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          reward_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          message: string | null
          reminder_time: string
          repeat_type: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          message?: string | null
          reminder_time: string
          repeat_type?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          message?: string | null
          reminder_time?: string
          repeat_type?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          points: number
          stock: number
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          points: number
          stock?: number
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          points?: number
          stock?: number
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          barber_shop_id: string
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          price: number
          updated_at: string
        }
        Insert: {
          barber_shop_id: string
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          price: number
          updated_at?: string
        }
        Update: {
          barber_shop_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barber_shop_id_fkey"
            columns: ["barber_shop_id"]
            isOneToOne: false
            referencedRelation: "barber_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          homepage_layout: Json | null
          id: string
          meta_description: string | null
          site_title: string
          social_media: Json | null
          theme_colors: Json | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          homepage_layout?: Json | null
          id?: string
          meta_description?: string | null
          site_title?: string
          social_media?: Json | null
          theme_colors?: Json | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          homepage_layout?: Json | null
          id?: string
          meta_description?: string | null
          site_title?: string
          social_media?: Json | null
          theme_colors?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login: string | null
          status: Database["public"]["Enums"]["super_admin_status"]
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          status?: Database["public"]["Enums"]["super_admin_status"]
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          status?: Database["public"]["Enums"]["super_admin_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      task_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed: boolean | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_default: boolean | null
          points: number
          title: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed?: boolean | null
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_default?: boolean | null
          points: number
          title: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed?: boolean | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          points?: number
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "child_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_appointments: {
        Row: {
          created_at: string
          customer_id: string | null
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          staff_id: string | null
          start_time: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "tenant_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "tenant_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit: string | null
          name: string
          notes: string | null
          phone: string | null
          preferences: Json | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: Json | null
          contact_info: Json | null
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_end_date: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          contact_info?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          contact_info?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      check_if_master_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      copy_default_tasks_to_user: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          recipient_id: string
          notification_title: string
          notification_message: string
          notification_type: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_master_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_tenant_admin: {
        Args: { tenant_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { tenant_id: string }
        Returns: boolean
      }
      log_action: {
        Args: { action: string; details?: string }
        Returns: undefined
      }
      log_admin_activity: {
        Args: {
          action: string
          entity_type: string
          entity_id: string
          details?: Json
        }
        Returns: string
      }
      log_user_activity: {
        Args: { activity_type: string; activity_details: Json }
        Returns: undefined
      }
      mark_message_as_read: {
        Args: { message_id: string }
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      reset_daily_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_points: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      admin_master_role: "super_admin" | "manager" | "support"
      admin_role: "super_admin" | "manager" | "support"
      app_role: "admin" | "user"
      barber_admin_role: "owner" | "manager" | "receptionist"
      client_status: "active" | "inactive" | "pending" | "blocked"
      license_status: "Ativa" | "Expirada" | "Trial" | "Suspensa" | "Cancelada"
      plano_tipo: "Basic" | "Pro" | "Enterprise"
      plano_type: "Basic" | "Pro" | "Enterprise"
      subscription_plan: "free" | "basic" | "pro" | "premium"
      super_admin_status: "active" | "inactive"
      tenant_status: "active" | "suspended" | "pending" | "cancelled"
      user_role: "user" | "admin"
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
      admin_master_role: ["super_admin", "manager", "support"],
      admin_role: ["super_admin", "manager", "support"],
      app_role: ["admin", "user"],
      barber_admin_role: ["owner", "manager", "receptionist"],
      client_status: ["active", "inactive", "pending", "blocked"],
      license_status: ["Ativa", "Expirada", "Trial", "Suspensa", "Cancelada"],
      plano_tipo: ["Basic", "Pro", "Enterprise"],
      plano_type: ["Basic", "Pro", "Enterprise"],
      subscription_plan: ["free", "basic", "pro", "premium"],
      super_admin_status: ["active", "inactive"],
      tenant_status: ["active", "suspended", "pending", "cancelled"],
      user_role: ["user", "admin"],
    },
  },
} as const
