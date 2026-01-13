
import { Database } from '@/integrations/supabase/types';

// Tipo para a view painel_clientes (compatibilidade)
export type PainelCliente = {
  id: string;
  nome: string;
  email: string | null;
  whatsapp?: string | null;
  telefone?: string | null;
  data_nascimento: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// Tipo para barbeiros do painel
export type PainelBarbeiro = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  image_url?: string | null;
  foto_url?: string | null;
  specialties?: string[] | string | null;
  experience?: string | null;
  commission_rate?: number | null;
  taxa_comissao?: number | null;
  is_active?: boolean | null;
  ativo?: boolean | null;
  role?: string | null;
  staff_id?: string | null;
};

// Tipos do sistema unificado (painel)
export type PainelAgendamento = {
  id: string;
  cliente_id?: string | null;
  servico_id?: string | null;
  barbeiro_id?: string | null;
  data: string;
  hora: string;
  status?: string | null;
  status_totem?: string | null;
  notas?: string | null;
  venda_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  painel_servicos?: any;
  painel_barbeiros?: any;
  painel_clientes?: any;
  cliente?: PainelCliente | null;
  servico?: any;
  barbeiro?: PainelBarbeiro | null;
};

// Adapter para compatibilidade com código existente
export type Appointment = {
  id: string;
  client_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  discount_amount?: number | null;
  services?: any;
  created_at?: string | null;
  updated_at?: string | null;
  client?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string | null;
  } | null;
  staff?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
};

// Define um tipo para novos agendamentos (sem id e timestamps)
export type NewAppointment = Partial<PainelAgendamento>;

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
  specialties?: string[] | string | null;
  experience?: string | null;
  commission_rate?: number | null;
  is_active?: boolean | null;
  role?: string | null;
  staff_id?: string | null;
};

// Define um tipo para clientes (painel)
export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  birth_date?: string | null;
};
