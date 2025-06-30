
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
      // Buscar barbeiros da tabela 'staff' (não 'barbers')
      console.log('1. Buscando barbeiros da tabela staff...');
      const { data: allBarbers, error: barbersError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');

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
      
      if (!allBarbers || allBarbers.length === 0) {
        console.log('Nenhum barbeiro ativo encontrado');
        setAvailableBarbers([]);
        return;
      }

      // Verificar se é domingo (não trabalha)
      const dayOfWeek = date.getDay();
      console.log(`2. Verificando dia da semana: ${dayOfWeek} (0=domingo)`);
      
      if (dayOfWeek === 0) {
        console.log('Domingo - barbearia fechada');
        setAvailableBarbers([]);
        return;
      }

      // Verificar horário de expediente (09:00-20:00)
      const [hours, minutes] = time.split(':').map(Number);
      const requestedTime = hours * 60 + minutes;
      const endTimeWithDuration = requestedTime + duration;

      console.log(`Horário solicitado: ${time} (${requestedTime} min)`);
      console.log(`Expediente: 09:00-20:00 (540-1200 min)`);

      if (requestedTime < 540 || endTimeWithDuration > 1200) {
        console.log('Horário fora do expediente');
        setAvailableBarbers([]);
        return;
      }

      // Verificar conflitos com agendamentos existentes
      console.log('3. Verificando conflitos de agendamento...');
      const availableBarbersList: AvailableBarber[] = [];
      
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      console.log(`Verificando conflitos entre: ${startDateTime.toISOString()} e ${endDateTime.toISOString()}`);

      for (const barber of allBarbers) {
        console.log(`Verificando barbeiro: ${barber.name} (${barber.id})`);
        
        // Buscar agendamentos conflitantes
        const { data: conflicts, error: conflictError } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status')
          .eq('staff_id', barber.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', date.toISOString().split('T')[0] + 'T00:00:00')
          .lt('start_time', date.toISOString().split('T')[0] + 'T23:59:59');

        if (conflictError) {
          console.error(`Erro ao verificar conflitos para ${barber.name}:`, conflictError);
          // Em caso de erro, considerar disponível
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
          continue;
        }

        // Verificar se há conflito de horário
        let hasConflict = false;
        if (conflicts && conflicts.length > 0) {
          hasConflict = conflicts.some(appointment => {
            const appStart = new Date(appointment.start_time);
            const appEnd = new Date(appointment.end_time);
            
            // Verificar sobreposição
            const overlap = startDateTime < appEnd && endDateTime > appStart;
            
            if (overlap) {
              console.log(`✗ Conflito para ${barber.name}: ${appStart.toLocaleTimeString()} - ${appEnd.toLocaleTimeString()}`);
            }
            
            return overlap;
          });
        }

        if (!hasConflict) {
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
          console.log(`✓ Barbeiro ${barber.name} disponível`);
        } else {
          console.log(`✗ Barbeiro ${barber.name} não disponível (conflito)`);
        }
      }
      
      console.log('4. Resultado final:', availableBarbersList.length, 'barbeiros disponíveis');
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
