
import { Database } from '@/integrations/supabase/types';

// Define um tipo baseado na tabela appointments do Supabase
export type Appointment = Database['public']['Tables']['appointments']['Row'];

// Define um tipo para novos agendamentos (sem id e timestamps)
export type NewAppointment = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de agendamento
export interface AppointmentFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  barber: string;
  date: Date | undefined;
  notes?: string;
}

// Define um tipo para serviços
export type Service = Database['public']['Tables']['services']['Row'];

// Define um tipo para barbeiros (staff)
export type StaffMember = Database['public']['Tables']['staff']['Row'];

// Define um tipo para clientes
export type Client = Database['public']['Tables']['clients']['Row'];
