
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      // Usar a função SQL atualizada para obter slots disponíveis
      const { data, error } = await supabase.rpc('get_available_time_slots', {
        p_staff_id: staffId,
        p_date: date.toISOString().split('T')[0],
        p_service_duration: serviceDuration
      });

      if (error) {
        console.error('Erro ao buscar slots disponíveis:', error);
        throw error;
      }

      const slots: TimeSlot[] = (data || []).map((slot: any) => ({
        time: slot.time_slot,
        available: true,
        staffId
      }));

      setAvailableSlots(slots);
      return slots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableSlots([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkBarberAvailability = useCallback(async (
    date: Date,
    time: string,
    serviceId: string,
    staffMembers: any[]
  ) => {
    setIsLoading(true);
    try {
      // Buscar duração do serviço
      const { data: serviceData } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .single();

      const serviceDuration = serviceData?.duration || 60;

      // Verificar disponibilidade para cada barbeiro usando a função SQL
      const availability = await Promise.all(
        staffMembers.map(async (staff) => {
          try {
            const { data: isAvailable } = await supabase.rpc('check_barber_availability', {
              p_barber_id: staff.id,
              p_date: date.toISOString().split('T')[0],
              p_start_time: time,
              p_duration_minutes: serviceDuration
            });

            // Buscar horário de trabalho para este dia
            const dayOfWeek = date.getDay();
            const { data: workingHours } = await supabase
              .from('working_hours')
              .select('start_time, end_time')
              .eq('staff_id', staff.id)
              .eq('day_of_week', dayOfWeek)
              .eq('is_active', true)
              .maybeSingle();

            // Buscar todos os slots disponíveis para o dia
            const { data: slots } = await supabase.rpc('get_available_time_slots', {
              p_staff_id: staff.id,
              p_date: date.toISOString().split('T')[0],
              p_service_duration: serviceDuration
            });

            return {
              id: staff.id,
              name: staff.name,
              available: Boolean(isAvailable),
              workingHours: workingHours ? {
                start: workingHours.start_time,
                end: workingHours.end_time
              } : undefined,
              availableSlots: (slots || []).map((slot: any) => slot.time_slot)
            };
          } catch (error) {
            console.error(`Erro ao verificar disponibilidade para ${staff.name}:`, error);
            return {
              id: staff.id,
              name: staff.name,
              available: false,
              availableSlots: []
            };
          }
        })
      );

      setBarberAvailability(availability);
      return availability;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade dos barbeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
      setBarberAvailability([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getWorkingHours = useCallback(async (staffId: string, date: Date) => {
    try {
      const dayOfWeek = date.getDay();
      const { data, error } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar horário de trabalho:', error);
      return null;
    }
  }, []);

  const setupDefaultSchedule = useCallback(async (staffId: string) => {
    try {
      // Configuração padrão para novos barbeiros
      const defaultSchedule = [
        { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }, // Segunda
        { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_active: true }, // Terça
        { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_active: true }, // Quarta
        { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_active: true }, // Quinta
        { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_active: true }, // Sexta
        { day_of_week: 6, start_time: '09:00', end_time: '14:00', is_active: true }, // Sábado
      ];

      const workingHours = defaultSchedule.map(schedule => ({
        staff_id: staffId,
        ...schedule
      }));

      const { error } = await supabase
        .from('working_hours')
        .insert(workingHours);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Horários padrão configurados para o barbeiro.",
      });
    } catch (error) {
      console.error('Erro ao configurar horários padrão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível configurar os horários padrão.",
        variant: "destructive",
      });
    }
  }, [toast]);

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
