
import { Database } from '@/integrations/supabase/types';

// Define o tipo para tickets de suporte
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'] & {
  clients?: {
    name: string;
    email?: string | null;
  };
  staff?: {
    name: string;
  };
};

// Define um tipo para novos tickets (sem id e timestamps)
export type NewSupportTicket = Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>;

// Define o tipo para respostas de tickets
export type TicketResponse = Database['public']['Tables']['ticket_responses']['Row'] & {
  staff?: {
    name: string;
  };
};

// Define um tipo para o formulário de tickets
export interface SupportTicketFormData {
  subject: string;
  description: string;
  client_id: string | null;
  staff_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}
