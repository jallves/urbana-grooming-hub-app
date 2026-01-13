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
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_available: boolean | null
          staff_id: string | null
          time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_available?: boolean | null
          staff_id?: string | null
          time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_available?: boolean | null
          staff_id?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          staff_id: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string | null
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
            referencedRelation: "painel_servicos"
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
      barber_availability: {
        Row: {
          barber_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      barber_commissions: {
        Row: {
          barber_id: string
          created_at: string | null
          data_pagamento: string | null
          id: string
          status: string | null
          tipo: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          status?: string | null
          tipo?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          status?: string | null
          tipo?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_commissions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_commissions_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          status: string | null
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          barbeiro_id: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          status: string | null
          tipo: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          barbeiro_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          status?: string | null
          tipo?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          barbeiro_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          status?: string | null
          tipo?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_amount: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          barber_id: string | null
          barber_name: string | null
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          payment_date: string | null
          reference_id: string | null
          reference_type: string | null
          service_id: string | null
          service_name: string | null
          status: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          barber_id?: string | null
          barber_name?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_date?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          barber_id?: string | null
          barber_name?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_date?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "painel_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          src: string
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          src: string
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          src?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          target_audience: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      painel_agendamentos: {
        Row: {
          barbeiro_id: string | null
          cliente_id: string | null
          created_at: string | null
          data: string
          hora: string
          id: string
          notas: string | null
          painel_barbeiros: Json | null
          painel_clientes: Json | null
          painel_servicos: Json | null
          servico_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          barbeiro_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data: string
          hora: string
          id?: string
          notas?: string | null
          painel_barbeiros?: Json | null
          painel_clientes?: Json | null
          painel_servicos?: Json | null
          servico_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          barbeiro_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data?: string
          hora?: string
          id?: string
          notas?: string | null
          painel_barbeiros?: Json | null
          painel_clientes?: Json | null
          painel_servicos?: Json | null
          servico_id?: string | null
          status?: string | null
          updated_at?: string | null
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
          ativo: boolean | null
          commission_rate: number | null
          created_at: string | null
          email: string | null
          experience: string | null
          foto_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          nome: string
          role: string | null
          specialties: string[] | null
          staff_id: string | null
          taxa_comissao: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          foto_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          nome: string
          role?: string | null
          specialties?: string[] | null
          staff_id?: string | null
          taxa_comissao?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          foto_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          nome?: string
          role?: string | null
          specialties?: string[] | null
          staff_id?: string | null
          taxa_comissao?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      painel_clientes: {
        Row: {
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          notas: string | null
          pin_hash: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          notas?: string | null
          pin_hash?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          notas?: string | null
          pin_hash?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      painel_produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          estoque: number | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      painel_servicos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          duracao: number
          duration: number | null
          exibir_home: boolean | null
          id: string
          is_active: boolean | null
          name: string | null
          nome: string
          preco: number
          price: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao: number
          duration?: number | null
          exibir_home?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          nome: string
          preco: number
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao?: number
          duration?: number | null
          exibir_home?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          nome?: string
          preco?: number
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_staff: {
        Row: {
          created_at: string | null
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
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
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
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
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          role: string | null
          specialties: string[] | null
          staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          specialties?: string[] | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          specialties?: string[] | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_module_access: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          staff_id?: string
          updated_at?: string | null
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
      totem_auth: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          pin_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pin_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pin_hash?: string
        }
        Relationships: []
      }
      totem_payments: {
        Row: {
          amount: number
          created_at: string | null
          error_message: string | null
          id: string
          payment_method: string
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          venda_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_method: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          venda_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_method?: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "totem_payments_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_valid: boolean | null
          token: string
          totem_auth_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_valid?: boolean | null
          token: string
          totem_auth_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_valid?: boolean | null
          token?: string
          totem_auth_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "totem_sessions_totem_auth_id_fkey"
            columns: ["totem_auth_id"]
            isOneToOne: false
            referencedRelation: "totem_auth"
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
      vendas: {
        Row: {
          barbeiro_id: string | null
          cliente_id: string | null
          created_at: string | null
          desconto: number | null
          forma_pagamento: string | null
          gorjeta: number | null
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          barbeiro_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          gorjeta?: number | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number
        }
        Update: {
          barbeiro_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          gorjeta?: number | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "painel_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_itens: {
        Row: {
          barbeiro_id: string | null
          created_at: string | null
          id: string
          item_id: string
          nome: string
          preco_unitario: number
          quantidade: number | null
          subtotal: number
          tipo: string
          venda_id: string
        }
        Insert: {
          barbeiro_id?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          nome: string
          preco_unitario: number
          quantidade?: number | null
          subtotal: number
          tipo: string
          venda_id: string
        }
        Update: {
          barbeiro_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          nome?: string
          preco_unitario?: number
          quantidade?: number | null
          subtotal?: number
          tipo?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "painel_barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
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
          is_available: boolean | null
          staff_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          staff_id?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          staff_id?: string | null
          start_time?: string
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
      apply_coupon_to_appointment: {
        Args: { p_appointment_id: string; p_coupon_code: string }
        Returns: Json
      }
      create_public_appointment: {
        Args: {
          p_client_id: string
          p_end_time: string
          p_notes: string
          p_service_id: string
          p_staff_id: string
          p_start_time: string
        }
        Returns: string
      }
      create_public_client: {
        Args: {
          client_email: string
          client_name: string
          client_phone: string
        }
        Returns: string
      }
      get_birthday_clients: { Args: never; Returns: Json }
      get_staff_module_access: {
        Args: { staff_id_param: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_higher: { Args: { _user_id: string }; Returns: boolean }
      update_staff_module_access: {
        Args: { module_ids_param: string[]; staff_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "master" | "admin" | "manager" | "barber" | "user"
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
      app_role: ["master", "admin", "manager", "barber", "user"],
    },
  },
} as const
