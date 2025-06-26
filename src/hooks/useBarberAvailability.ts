
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailableBarber {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
}

export const useBarberAvailability = () => {
  const [availableBarbers, setAvailableBarbers] = useState<AvailableBarber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAvailableBarbers = useCallback(async (
    serviceId: string,
    date: Date,
    time: string,
    duration: number
  ) => {
    console.log('=== INICIANDO BUSCA DE BARBEIROS ===');
    console.log('Parâmetros:', { serviceId, date, time, duration });
    
    setIsLoading(true);
    
    try {
      // Primeiro, buscar todos os barbeiros ativos
      console.log('1. Buscando todos os barbeiros ativos...');
      const { data: allBarbers, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true);

      if (barbersError) {
        console.error('Erro ao buscar barbeiros:', barbersError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros.",
          variant: "destructive",
        });
        setAvailableBarbers([]);
        return;
      }

      console.log('Barbeiros encontrados:', allBarbers?.length || 0);
      console.log('Lista de barbeiros:', allBarbers?.map(b => ({ id: b.id, name: b.name, email: b.email })));

      if (!allBarbers || allBarbers.length === 0) {
        console.log('Nenhum barbeiro ativo encontrado');
        setAvailableBarbers([]);
        return;
      }

      // Verificar disponibilidade de cada barbeiro individualmente
      console.log('2. Verificando disponibilidade individual...');
      const availableBarbersList: AvailableBarber[] = [];
      
      for (const barber of allBarbers) {
        console.log(`Verificando barbeiro: ${barber.name} (${barber.id})`);
        
        // Verificar se o barbeiro está disponível neste horário
        const isAvailable = await checkBarberAvailability(barber.id, date, time, duration);
        console.log(`Barbeiro ${barber.name} disponível:`, isAvailable);
        
        if (isAvailable) {
          availableBarbersList.push({
            id: barber.id,
            name: barber.name || 'Sem nome',
            email: barber.email || '',
            phone: barber.phone || '',
            image_url: barber.image_url || '',
            specialties: barber.specialties || '',
            experience: barber.experience || '',
            role: barber.role || 'barber',
            is_active: barber.is_active
          });
          console.log(`✓ Barbeiro ${barber.name} adicionado à lista`);
        } else {
          console.log(`✗ Barbeiro ${barber.name} não disponível`);
        }
      }
      
      console.log('3. Resultado final:', availableBarbersList.length, 'barbeiros disponíveis');
      console.log('Lista final:', availableBarbersList.map(b => ({ id: b.id, name: b.name })));
      
      setAvailableBarbers(availableBarbersList);

    } catch (error) {
      console.error('Erro inesperado ao buscar barbeiros:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao buscar barbeiros.",
        variant: "destructive",
      });
      setAvailableBarbers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkBarberAvailability = async (
    barberId: string,
    date: Date,
    time: string,
    duration: number
  ): Promise<boolean> => {
    try {
      console.log(`  Verificando disponibilidade para barbeiro ${barberId}:`);
      
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      console.log(`  Data/hora: ${startDateTime.toLocaleString()} até ${endDateTime.toLocaleString()}`);

      // 1. Verificar se é domingo (dia 0) - barbeiros não trabalham no domingo
      const dayOfWeek = startDateTime.getDay();
      console.log(`  Dia da semana: ${dayOfWeek} (0=domingo, 1=segunda, etc.)`);
      
      if (dayOfWeek === 0) {
        console.log(`  ✗ Domingo - barbeiro não trabalha`);
        return false;
      }

      // 2. Verificar horários de trabalho específicos do barbeiro
      const { data: workingHours, error: workingError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (workingError) {
        console.error(`  Erro ao verificar horários de trabalho:`, workingError);
        // Em caso de erro, usar horário padrão
      }

      const timeOnly = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endTimeOnly = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`  Horário solicitado: ${timeOnly} até ${endTimeOnly}`);

      if (workingHours && workingHours.length > 0) {
        // Se há horários específicos, verificar se está dentro deles
        const workingHour = workingHours[0];
        console.log(`  Horário específico encontrado: ${workingHour.start_time} - ${workingHour.end_time}`);
        
        if (timeOnly < workingHour.start_time || endTimeOnly > workingHour.end_time) {
          console.log(`  ✗ Fora do horário específico do barbeiro`);
          return false;
        }
      } else {
        // Usar horário padrão (09:00-20:00) se não há configuração específica
        console.log(`  Usando horário padrão (09:00-20:00)`);
        
        if (timeOnly < '09:00' || endTimeOnly > '20:00') {
          console.log(`  ✗ Fora do horário padrão (09:00-20:00)`);
          return false;
        }
      }

      // 3. Verificar conflitos com agendamentos existentes
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status')
        .eq('staff_id', barberId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', startDateTime.toISOString().split('T')[0] + 'T00:00:00')
        .lt('start_time', startDateTime.toISOString().split('T')[0] + 'T23:59:59');

      if (conflictError) {
        console.error(`  Erro ao verificar conflitos:`, conflictError);
        // Em caso de erro, considerar disponível para não bloquear
        return true;
      }

      if (conflicts && conflicts.length > 0) {
        console.log(`  Agendamentos no dia: ${conflicts.length}`);
        
        // Verificar se há sobreposição de horários
        const hasOverlap = conflicts.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          
          const overlap = startDateTime < appEnd && endDateTime > appStart;
          
          if (overlap) {
            console.log(`  ✗ Conflito com agendamento: ${appStart.toLocaleTimeString()} - ${appEnd.toLocaleTimeString()}`);
          }
          
          return overlap;
        });

        if (hasOverlap) {
          return false;
        }
      }

      // 4. Verificar disponibilidade específica do dia (se existir)
      const { data: availability, error: availabilityError } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', startDateTime.toISOString().split('T')[0]);

      if (availabilityError) {
        console.error(`  Erro ao verificar disponibilidade específica:`, availabilityError);
        // Em caso de erro, considerar disponível
      } else if (availability && availability.length > 0) {
        const dayAvailability = availability[0];
        console.log(`  Disponibilidade específica encontrada: ${dayAvailability.is_available ? 'disponível' : 'indisponível'}`);
        
        if (!dayAvailability.is_available) {
          console.log(`  ✗ Marcado como indisponível para este dia`);
          return false;
        }
        
        // Verificar horário específico se definido
        if (dayAvailability.start_time && dayAvailability.end_time) {
          if (timeOnly < dayAvailability.start_time || endTimeOnly > dayAvailability.end_time) {
            console.log(`  ✗ Fora do horário específico do dia: ${dayAvailability.start_time} - ${dayAvailability.end_time}`);
            return false;
          }
        }
      }

      console.log(`  ✓ Barbeiro disponível`);
      return true;

    } catch (error) {
      console.error(`Erro na verificação de disponibilidade para ${barberId}:`, error);
      // Em caso de erro, considerar disponível
      return true;
    }
  };

  const validateBooking = useCallback(async (
    clientId: string,
    staffId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date
  ) => {
    try {
      console.log('Validando agendamento:', { clientId, staffId, serviceId, startTime, endTime });
      
      const { data, error } = await supabase.rpc('validate_appointment_booking', {
        p_client_id: clientId,
        p_staff_id: staffId,
        p_service_id: serviceId,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString()
      });

      if (error) {
        console.error('Erro na validação:', error);
        return { valid: false, error: 'Erro na validação do agendamento' };
      }

      console.log('Resultado da validação:', data);
      return data;
    } catch (error) {
      console.error('Erro na validação:', error);
      return { valid: false, error: 'Erro inesperado na validação' };
    }
  }, []);

  return {
    availableBarbers,
    isLoading,
    fetchAvailableBarbers,
    validateBooking
  };
};
