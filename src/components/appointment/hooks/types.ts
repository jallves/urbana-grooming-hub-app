
import { z } from 'zod';

export const appointmentSchema = z.object({
  service_id: z.string().min(1, "Selecione um serviço"),
  date: z.date({
    required_error: "Selecione uma data",
  }),
  time: z.string().min(1, "Selecione um horário"),
  staff_id: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().optional(),
});

export type FormData = z.infer<typeof appointmentSchema>;

export interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}
