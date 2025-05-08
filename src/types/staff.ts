
import { Database } from '@/integrations/supabase/types';

// Define o tipo para profissionais (staff)
export type StaffMember = Database['public']['Tables']['staff']['Row'];

// Define um tipo para novos profissionais (sem id e timestamps)
export type NewStaffMember = Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de profissionais
export interface StaffFormData {
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean;
}
