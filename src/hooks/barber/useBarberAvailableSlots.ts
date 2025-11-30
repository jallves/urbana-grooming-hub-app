import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
}

export const useBarberAvailableSlots = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const fetchAvailableSlots = useCallback(async (
    barberId: string,
    date: Date,
    serviceDuration: number,
    excludeAppointmentId?: string
  ) => {
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isCurrentDay = isToday(date);
      
      // Buscar todos os horários possíveis (8:30 às 20h, intervalos de 30min)
      // REGRA: Primeiro atendimento às 08:30 (preparação de 08:00-08:30)
      // REGRA: Último slot = 20:00 - duração do serviço (ex: 60min -> último slot 19:00)
      const allSlots: TimeSlot[] = [];
      const FIRST_SLOT_HOUR = 8;
      const FIRST_SLOT_MINUTE = 30;
      const CLOSING_HOUR = 20;
      const CLOSING_MINUTE = 0;
      
      // Calcular o último horário possível baseado na duração do serviço
      const closingTotalMinutes = CLOSING_HOUR * 60 + CLOSING_MINUTE;
      const lastSlotTotalMinutes = closingTotalMinutes - serviceDuration;
      
      for (let hour = FIRST_SLOT_HOUR; hour < CLOSING_HOUR; hour++) {
        for (let minute of [0, 30]) {
          // Pular 08:00 - primeiro slot é 08:30
          if (hour === FIRST_SLOT_HOUR && minute < FIRST_SLOT_MINUTE) {
            continue;
          }
          
          const slotTotalMinutes = hour * 60 + minute;
          
          // Pular se o serviço não couber antes do fechamento
          if (slotTotalMinutes > lastSlotTotalMinutes) {
            continue;
          }
          
          // Se for hoje, só incluir horários futuros (pelo menos 30min à frente)
          if (isCurrentDay) {
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            
            // Pular se o horário já passou ou está muito próximo (menos de 30min)
            if (slotTotalMinutes <= currentTotalMinutes + 30) {
              continue;
            }
          }
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push({ time: timeString, available: false });
        }
      }

      // Verificar disponibilidade de cada horário
      const slotsWithAvailability = await Promise.all(
        allSlots.map(async (slot) => {
          const { data, error } = await supabase
            .rpc('check_barber_slot_availability', {
              p_barbeiro_id: barberId,
              p_date: formattedDate,
              p_time: slot.time,
              p_duration: serviceDuration,
              p_exclude_appointment_id: excludeAppointmentId || null
            });

          if (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            return { ...slot, available: false };
          }

          return { ...slot, available: data === true };
        })
      );

      setSlots(slotsWithAvailability);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    slots,
    loading,
    fetchAvailableSlots
  };
};
