
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
  birth_date?: string | null;
}
