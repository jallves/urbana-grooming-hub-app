// Tipos para o sistema de Totem

export type TotemSessionStatus = 
  | 'idle' 
  | 'searching' 
  | 'check_in' 
  | 'in_service' 
  | 'checkout' 
  | 'payment' 
  | 'completed';

export type PaymentMethod = 'pix' | 'credit' | 'debit';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TotemSession {
  id: string;
  appointment_id: string;
  status: TotemSessionStatus;
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
}

export interface AppointmentExtraService {
  id: string;
  appointment_id: string;
  service_id: string;
  added_at: string;
  added_by: string;
  service?: {
    id: string;
    nome: string;
    preco: number;
    duracao: number;
  };
}

export interface TotemPayment {
  id: string;
  session_id: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  pix_qr_code?: string;
  pix_key?: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface TotemAppointment {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  observacoes?: string;
  cliente?: {
    id: string;
    nome: string;
    whatsapp: string;
    email?: string;
  };
  barbeiro?: {
    id: string;
    nome: string;
  };
  servico?: {
    id: string;
    nome: string;
    preco: number;
    duracao: number;
  };
  extra_services?: AppointmentExtraService[];
}

export interface CheckoutSummary {
  original_service: {
    nome: string;
    preco: number;
  };
  extra_services: Array<{
    nome: string;
    preco: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
}
