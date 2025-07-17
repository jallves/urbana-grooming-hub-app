import { SupabaseClient, createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do Supabase
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
      painel_clientes: {
        Row: {
          id: string
          created_at: string
          nome: string
          email: string
          whatsapp: string
          data_nascimento: string | null
          senha_hash: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          email: string
          whatsapp: string
          data_nascimento?: string | null
          senha_hash: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          email?: string
          whatsapp?: string
          data_nascimento?: string | null
          senha_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Adicione outras tabelas conforme necessário
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}