
import { Database } from '@/integrations/supabase/types';

// Define o tipo para clientes - now using auth.users id as primary key
export type Client = {
  id: string; // This will be the auth.users.id
  name: string;
  email: string;
  phone: string;
  birth_date?: string | null;
  whatsapp?: string | null;
  created_at: string;
  updated_at: string;
};

// Define um tipo para novos clientes (sem id e timestamps)
export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de clientes
export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  birth_date?: string;
  password: string;
  confirmPassword: string;
}

// Define um tipo para login
export interface ClientLoginData {
  email: string;
  password: string;
}
