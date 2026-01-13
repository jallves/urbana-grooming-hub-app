import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, parse } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
  staffId: string;
}

interface BarberAvailability {
  id: string;
  name: string;
  available: boolean;
  workingHours?: {
    start: string;
    end: string;
  };
  availableSlots?: string[];
}

export const useAdvancedAvailability = () => {
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableSlots = useCallback(async (
    staffId: string, 
    date: Date, 
    serviceDuration: number
  ) => {
    setIsLoading(true);
    try {
      const dayOfWeek = date.getDay();
      const dateStr = format(date, 'yyyy-MM-dd');

      // Buscar horário de trabalho
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (!workingHours) {
        setAvailableSlots([]);
        return [];
      }

      // Gerar slots
      const slots: TimeSlot[] = [];
      const startHour = parseInt(workingHours.start_time.split(':')[0]);
      const endHour = parseInt(workingHours.end_time.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({ time: timeString, available: true, staffId });
        }
      }

      setAvailableSlots(slots);
      return slots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      setAvailableSlots([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkBarberAvailability = useCallback(async (
    date: Date,
    time: string,
    serviceId: string,
    staffMembers: any[]
  ) => {
    setIsLoading(true);
    try {
      const availability = await Promise.all(
        staffMembers.map(async (staff) => {
          const dayOfWeek = date.getDay();
          const { data: workingHours } = await supabase
            .from('working_hours')
            .select('start_time, end_time')
            .eq('staff_id', staff.id)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .maybeSingle();

          return {
            id: staff.id,
            name: staff.name,
            available: !!workingHours,
            workingHours: workingHours ? {
              start: workingHours.start_time,
              end: workingHours.end_time
            } : undefined,
            availableSlots: []
          };
        })
      );

      setBarberAvailability(availability);
      return availability;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setBarberAvailability([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWorkingHours = useCallback(async (staffId: string, date: Date) => {
    const dayOfWeek = date.getDay();
    const { data } = await supabase
      .from('working_hours')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();
    return data;
  }, []);

  const setupDefaultSchedule = useCallback(async (staffId: string) => {
    const defaultSchedule = [
      { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true },
      { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_active: true },
      { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_active: true },
      { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_active: true },
      { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_active: true },
      { day_of_week: 6, start_time: '09:00', end_time: '14:00', is_active: true },
    ];

    await supabase.from('working_hours').insert(
      defaultSchedule.map(s => ({ staff_id: staffId, ...s }))
    );
  }, []);

  return {
    availableSlots,
    barberAvailability,
    isLoading,
    fetchAvailableSlots,
    checkBarberAvailability,
    getWorkingHours,
    setupDefaultSchedule
  };
};