
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

      console.log('🔍 Verificando disponibilidade do barbeiro:', {
        barberId,
        dayOfWeek,
        selectedTime,
        serviceDuration
      });

      // 1. Verificar se o barbeiro trabalha neste dia/horário (working_hours)
      // IMPORTANTE: usar barberId como staff_id na tabela working_hours
      const { data: workingHours, error: workingError } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', barberId)  // Usar barberId diretamente
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      console.log('⏰ Working hours encontrados:', workingHours);

      if (workingError || !workingHours) {
        console.log('❌ Barbeiro não trabalha neste dia:', workingError);
        toast({
          title: "Barbeiro indisponível",
          description: "O barbeiro não trabalha neste dia da semana.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se o horário está dentro do expediente padrão
      const workStart = workingHours.start_time;
      const workEnd = workingHours.end_time;
      const requestedStart = selectedTime;
      const requestedEnd = `${Math.floor((hours * 60 + minutes + serviceDuration) / 60).toString().padStart(2, '0')}:${((hours * 60 + minutes + serviceDuration) % 60).toString().padStart(2, '0')}`;

      console.log('⏰ Comparando horários:', {
        workStart,
        workEnd,
        requestedStart,
        requestedEnd
      });

      if (requestedStart < workStart || requestedEnd > workEnd) {
        toast({
          title: "Horário inválido",
          description: `O barbeiro trabalha das ${workStart} às ${workEnd} neste dia.`,
          variant: "destructive",
        });
        return false;
      }

      // 2. Verificar disponibilidade específica na tabela barber_availability (bloqueios)
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Buscar TODOS os registros de disponibilidade para o dia (pode haver múltiplos slots bloqueados)
      const { data: availabilityRecords, error: availabilityError } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', dateStr);

      console.log('📅 Disponibilidade específica:', availabilityRecords);

      if (availabilityError) {
        console.error('❌ Erro ao verificar disponibilidade específica:', availabilityError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se algum bloqueio afeta o horário solicitado
      if (availabilityRecords && availabilityRecords.length > 0) {
        const timeToMinutes = (time: string): number => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };

        const [reqHours, reqMinutes] = selectedTime.split(':').map(Number);
        const requestedStartMinutes = reqHours * 60 + reqMinutes;
        const requestedEndMinutes = requestedStartMinutes + serviceDuration;

        for (const availability of availabilityRecords) {
          if (!availability.is_available) {
            const blockStart = timeToMinutes(availability.start_time);
            const blockEnd = timeToMinutes(availability.end_time);
            
            // Verifica sobreposição
            if (requestedStartMinutes < blockEnd && requestedEndMinutes > blockStart) {
              toast({
                title: "Horário bloqueado",
                description: `Este horário está bloqueado: ${availability.start_time.substring(0, 5)} - ${availability.end_time.substring(0, 5)}.`,
                variant: "destructive",
              });
              return false;
            }
          }
        }

        // Verificar disponibilidade específica (quando is_available = true com horário definido)
        const specificAvailability = availabilityRecords.find(a => a.is_available);
        if (specificAvailability && specificAvailability.start_time && specificAvailability.end_time) {
          if (requestedStart < specificAvailability.start_time || requestedEnd > specificAvailability.end_time) {
            toast({
              title: "Horário fora do expediente",
              description: `Nesta data, o barbeiro trabalha das ${specificAvailability.start_time.substring(0, 5)} às ${specificAvailability.end_time.substring(0, 5)}.`,
              variant: "destructive",
            });
            return false;
          }
        }
      }

      // 3. Verificar conflitos com agendamentos existentes
      // IMPORTANTE: usar barberId como staff_id na tabela appointments
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('staff_id', barberId)  // Usar barberId diretamente
        .gte('start_time', startTime.toISOString().split('T')[0] + ' 00:00:00')
        .lt('start_time', startTime.toISOString().split('T')[0] + ' 23:59:59')
        .in('status', ['scheduled', 'confirmed']);

      console.log('📋 Conflitos encontrados:', conflicts);

      if (conflictError) {
        console.error('❌ Erro ao verificar conflitos:', conflictError);
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
        const overlap = startTime < appEnd && endTime > appStart;
        
        if (overlap) {
          console.log('⚠️ Conflito encontrado:', {
            appointmentStart: appStart,
            appointmentEnd: appEnd,
            requestedStart: startTime,
            requestedEnd: endTime
          });
        }
        
        return overlap;
      });

      if (hasConflict) {
        toast({
          title: "Horário ocupado",
          description: "Este horário já está ocupado. Escolha outro horário.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Barbeiro disponível no horário solicitado');
      return true;
    } catch (error) {
      console.error('💥 Erro na validação de disponibilidade:', error);
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
