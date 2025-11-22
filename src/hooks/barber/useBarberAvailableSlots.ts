import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
      
      // Buscar todos os horários possíveis (9h às 20h, intervalos de 30min)
      const allSlots: TimeSlot[] = [];
      for (let hour = 9; hour < 20; hour++) {
        for (let minute of [0, 30]) {
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
