// Tipos para o sistema de agendamento da barbearia

export interface Barber {
  id: string;
  name: string;
  email: string;
  specialty: string;
  commission_type: 'percent' | 'fixed';
  commission_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarberSchedule {
  id: string;
  barber_id: string;
  weekday: number; // 0=domingo, 6=sábado
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface NewAppointment {
  id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  barber?: Barber;
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
}

export interface Commission {
  id: string;
  appointment_id: string;
  barber_id: string;
  amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  paid_at?: string;
  
  // Relacionamentos
  appointment?: NewAppointment;
  barber?: Barber;
}

export interface AppointmentFormData {
  service_id: string;
  barber_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableDay {
  date: string;
  weekday: number;
  slots: TimeSlot[];
}