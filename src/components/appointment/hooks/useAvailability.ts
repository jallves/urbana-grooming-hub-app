
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarberAvailabilityInfo } from './types';

export const useAvailability = () => {
  const { toast } = useToast();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const fetchAvailableTimes = useCallback(async (date: Date, serviceId: string) => {
    if (!date || !serviceId) {
      setAvailableTimes([]);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      // Generate time slots from 8:00 to 20:00 in 30-minute intervals
      const timeSlots = [];
      for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          timeSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }

      setAvailableTimes(timeSlots);
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [toast]);

  const checkBarberAvailability = useCallback(async (date: Date, time: string, serviceId: string) => {
    if (!date || !time || !serviceId) {
      setBarberAvailability([]);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      console.log('Verificando disponibilidade dos barbeiros para:', { date, time, serviceId });
      
      // Buscar todos os barbeiros ativos - usando apenas a tabela staff
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (staffError) {
        console.error("Erro ao buscar barbeiros:", staffError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade dos barbeiros.",
          variant: "destructive",
        });
        setBarberAvailability([]);
        return;
      }

      if (!staffMembers || staffMembers.length === 0) {
        console.log('Nenhum barbeiro ativo encontrado');
        setBarberAvailability([]);
        return;
      }

      console.log('Barbeiros ativos encontrados:', staffMembers);

      // Buscar duração do serviço
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .single();

      let serviceDuration = 60; // Default duration
      if (serviceError || !serviceData) {
        console.error("Erro ao buscar duração do serviço:", serviceError);
        console.log("Usando duração padrão de 60 minutos");
      } else {
        serviceDuration = serviceData.duration;
      }

      // Calcular horário de início e fim do agendamento
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      console.log(`Verificando conflitos entre ${startTime.toISOString()} e ${endTime.toISOString()}`);

      // Verificar disponibilidade para cada barbeiro
      const availability = await Promise.all(staffMembers.map(async (staff) => {
        try {
          // Buscar agendamentos do barbeiro no mesmo dia
          const startOfDay = new Date(startTime);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(startTime);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('id, start_time, end_time, status')
            .eq('staff_id', staff.id)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .in('status', ['scheduled', 'confirmed']);

          if (appointmentError) {
            console.error(`Erro ao verificar agendamentos para ${staff.name}:`, appointmentError);
            return {
              id: staff.id,
              name: staff.name,
              available: false
            };
          }

          console.log(`Agendamentos encontrados para ${staff.name}:`, appointments);

          // Verificar se há conflito de horário
          let hasConflict = false;
          if (appointments && appointments.length > 0) {
            hasConflict = appointments.some(appointment => {
              const appStart = new Date(appointment.start_time);
              const appEnd = new Date(appointment.end_time);
              
              // Verificar sobreposição: o novo agendamento não pode começar antes do fim de um existente
              // nem terminar depois do início de um existente
              const conflict = (startTime < appEnd && endTime > appStart);
              
              if (conflict) {
                console.log(`Conflito encontrado para ${staff.name}:`, {
                  existente: `${appStart.toISOString()} - ${appEnd.toISOString()}`,
                  novo: `${startTime.toISOString()} - ${endTime.toISOString()}`
                });
              }
              
              return conflict;
            });
          }

          const isAvailable = !hasConflict;
          console.log(`${staff.name} está ${isAvailable ? 'disponível' : 'indisponível'}`);

          return {
            id: staff.id,
            name: staff.name,
            available: isAvailable
          };
        } catch (error) {
          console.error(`Erro ao verificar disponibilidade para ${staff.name}:`, error);
          return {
            id: staff.id,
            name: staff.name,
            available: false
          };
        }
      }));

      console.log('Resultado final da verificação de disponibilidade:', availability);
      setBarberAvailability(availability);

    } catch (error) {
      console.error("Erro ao verificar disponibilidade dos barbeiros:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
      setBarberAvailability([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [toast]);

  return {
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    fetchAvailableTimes,
    checkBarberAvailability,
  };
};
