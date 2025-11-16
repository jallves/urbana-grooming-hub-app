
import { Database } from '@/integrations/supabase/types';

// Tipos do sistema unificado (painel)
export type PainelAgendamento = Database['public']['Tables']['painel_agendamentos']['Row'] & {
  cliente?: Database['public']['Tables']['painel_clientes']['Row'];
  servico?: Database['public']['Tables']['painel_servicos']['Row'];
  barbeiro?: Database['public']['Tables']['painel_barbeiros']['Row'];
};

// Adapter para compatibilidade com código existente
export type Appointment = {
  id: string;
  client_id: string;
  service_id: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
    whatsapp?: string | null;
  };
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string | null;
  };
  staff?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
};

// Define um tipo para novos agendamentos (sem id e timestamps)
export type NewAppointment = Omit<
  Database['public']['Tables']['painel_agendamentos']['Row'], 
  'id' | 'created_at' | 'updated_at'
>;

// Define um tipo para o formulário de agendamento
export interface AppointmentFormData {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  notes: string;
}

// Define um tipo para serviços (painel)
export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string | null;
  is_active?: boolean | null;
};

// Define um tipo para barbeiros (painel)
export type StaffMember = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
  specialties?: string | null;
  experience?: string | null;
  commission_rate?: number | null;
  is_active?: boolean | null;
  role?: string | null;
};

// Define um tipo para clientes (painel)
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  birth_date?: string | null;
};
