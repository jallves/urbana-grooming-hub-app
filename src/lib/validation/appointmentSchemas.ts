
import { z } from 'zod';
import { sanitizeInput } from '@/lib/security';
import { addMinutes } from 'date-fns';

// Schema para criar agendamento
export const createAppointmentSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  service_id: z.string().uuid('ID do serviço inválido'),
  staff_id: z.string().uuid('ID do profissional inválido'),
  date: z.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    'Data não pode ser anterior ao dia atual'
  ),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').refine(
    (time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 9 && hours < 20;
    },
    'Horário deve estar entre 09:00 e 20:00'
  ),
  notes: z.string().optional().transform(val => val ? sanitizeInput(val) : undefined),
  couponCode: z.string().optional().transform(val => val ? sanitizeInput(val) : undefined),
  discountAmount: z.number().min(0, 'Desconto não pode ser negativo').default(0),
}).refine((data) => {
  // Validação adicional: se for hoje, horário não pode ser passado
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDate = new Date(data.date);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate.getTime() === today.getTime()) {
    const [hours, minutes] = data.time.split(':').map(Number);
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);
    
    // Adicionar 30 minutos de margem
    const minTime = addMinutes(now, 30);
    
    return selectedTime >= minTime;
  }
  
  return true;
}, {
  message: 'Para agendamentos hoje, escolha um horário com pelo menos 30 minutos de antecedência',
  path: ['time']
});

// Schema para atualizar agendamento
export const updateAppointmentSchema = z.object({
  id: z.string().uuid('ID do agendamento inválido'),
  date: z.date().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  notes: z.string().optional().transform(val => val ? sanitizeInput(val) : undefined),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
});

// Schema para cancelar agendamento
export const cancelAppointmentSchema = z.object({
  id: z.string().uuid('ID do agendamento inválido'),
  reason: z.string().min(1, 'Motivo do cancelamento é obrigatório').transform(sanitizeInput),
});

// Schema para confirmar agendamento
export const confirmAppointmentSchema = z.object({
  id: z.string().uuid('ID do agendamento inválido'),
});

// Schema para completar agendamento
export const completeAppointmentSchema = z.object({
  id: z.string().uuid('ID do agendamento inválido'),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional().transform(val => val ? sanitizeInput(val) : undefined),
});

// Schema para filtros de agendamento
export const appointmentFiltersSchema = z.object({
  date: z.date().optional(),
  status: z.enum(['all', 'scheduled', 'confirmed', 'completed', 'cancelled']).default('all'),
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
});

// Schema para horários disponíveis
export const availableTimesSchema = z.object({
  staff_id: z.string().uuid('ID do profissional inválido'),
  date: z.date().refine(
    (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Data não pode ser anterior ao dia atual'
  ),
  service_id: z.string().uuid('ID do serviço inválido'),
});

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
export type ConfirmAppointmentData = z.infer<typeof confirmAppointmentSchema>;
export type CompleteAppointmentData = z.infer<typeof completeAppointmentSchema>;
export type AppointmentFiltersData = z.infer<typeof appointmentFiltersSchema>;
export type AvailableTimesData = z.infer<typeof availableTimesSchema>;
