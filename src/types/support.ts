
// Define o tipo para tickets de suporte (simplified since support_tickets table doesn't exist)
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  client_id: string | null;
  staff_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    email?: string | null;
  };
  staff?: {
    name: string;
  };
}

// Define um tipo para novos tickets (sem id e timestamps)
export type NewSupportTicket = Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>;

// Define o tipo para respostas de tickets
export interface TicketResponse {
  id: string;
  ticket_id: string;
  staff_id: string | null;
  message: string;
  response_text: string;
  responder_type: 'staff' | 'client';
  created_at: string;
  staff?: {
    name: string;
  };
}

// Define um tipo para o formulário de tickets
export interface SupportTicketFormData {
  subject: string;
  description: string;
  client_id: string | null;
  staff_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}
