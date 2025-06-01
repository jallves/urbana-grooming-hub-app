
import { Database } from '@/integrations/supabase/types';

// Define o tipo para clientes
export type Client = Database['public']['Tables']['clients']['Row'];

// Define um tipo para novos clientes (sem id e timestamps)
export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de clientes
export interface ClientFormData {
  name: string;
  email: string | null;
  phone: string;
  birth_date?: string;
  password: string;
  confirmPassword: string;
}

// Define um tipo para login
export interface ClientLoginData {
  email: string;
  password: string;
}

// Define um tipo para sessão do cliente
export interface ClientSession {
  id: string;
  client_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}
