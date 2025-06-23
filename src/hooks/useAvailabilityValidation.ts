
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAvailabilityValidation = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkBarberAvailability = async (
    barberId: string,
    selectedDate: Date,
    selectedTime: string,
    serviceDuration: number
  ): Promise<boolean> => {
    setIsChecking(true);
    
    try {
      const dayOfWeek = selectedDate.getDay();
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      // 1. Verificar se o barbeiro trabalha neste dia/horário
      const { data: workingHours, error: workingError } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (workingError || !workingHours) {
        toast({
          title: "Barbeiro indisponível",
          description: "O barbeiro não trabalha neste dia da semana.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se o horário está dentro do expediente
      const workStart = workingHours.start_time;
      const workEnd = workingHours.end_time;
      const requestedStart = selectedTime;
      const requestedEnd = `${Math.floor((hours * 60 + minutes + serviceDuration) / 60).toString().padStart(2, '0')}:${((hours * 60 + minutes + serviceDuration) % 60).toString().padStart(2, '0')}`;

      if (requestedStart < workStart || requestedEnd > workEnd) {
        toast({
          title: "Horário inválido",
          description: `O barbeiro trabalha das ${workStart} às ${workEnd} neste dia.`,
          variant: "destructive",
        });
        return false;
      }

      // 2. Verificar conflitos com agendamentos existentes
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('staff_id', barberId)
        .gte('start_time', startTime.toISOString().split('T')[0] + ' 00:00:00')
        .lt('start_time', startTime.toISOString().split('T')[0] + ' 23:59:59')
        .in('status', ['scheduled', 'confirmed']);

      if (conflictError) {
        console.error('Erro ao verificar conflitos:', conflictError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se há sobreposição de horários
      const hasConflict = conflicts?.some(appointment => {
        const appStart = new Date(appointment.start_time);
        const appEnd = new Date(appointment.end_time);
        return startTime < appEnd && endTime > appStart;
      });

      if (hasConflict) {
        toast({
          title: "Horário ocupado",
          description: "Este horário já está ocupado. Escolha outro horário.",
          variant: "destructive",
        });
        return false;
      }

      // 3. Verificar disponibilidade específica na tabela barber_availability
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: specificAvailability } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', dateStr)
        .single();

      if (specificAvailability) {
        if (!specificAvailability.is_available) {
          toast({
            title: "Barbeiro indisponível",
            description: specificAvailability.reason || "O barbeiro não está disponível nesta data.",
            variant: "destructive",
          });
          return false;
        }

        // Se há disponibilidade específica, verificar horários
        if (requestedStart < specificAvailability.start_time || requestedEnd > specificAvailability.end_time) {
          toast({
            title: "Horário fora do expediente",
            description: `Nesta data, o barbeiro trabalha das ${specificAvailability.start_time} às ${specificAvailability.end_time}.`,
            variant: "destructive",
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro na validação de disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkBarberAvailability,
    isChecking,
  };
};
