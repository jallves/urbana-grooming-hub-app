
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
      // No modelo unificado, todos os barbeiros podem fazer todos os serviços
      // Buscar barbeiros ativos da tabela painel_barbeiros
      console.log('1. Buscando barbeiros ativos...');
      const { data: allBarbers, error: barbersError } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .eq('available_for_booking', true)
        .order('nome');

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
        console.log('Nenhum barbeiro ativo');
        setAvailableBarbers([]);
        return;
      }

      // Verificar horário de expediente
      // Segunda a Sábado: 08:00-20:00 (480-1200 min)
      // Domingo: 09:00-13:00 (540-780 min)
      const dayOfWeek = date.getDay();
      console.log(`3. Verificando dia da semana: ${dayOfWeek} (0=domingo)`);
      
      const isSunday = dayOfWeek === 0;
      const [hours, minutes] = time.split(':').map(Number);
      const requestedTime = hours * 60 + minutes;
      const endTimeWithDuration = requestedTime + duration;

      // Validar horário de expediente baseado no dia da semana
      const minTime = isSunday ? 540 : 480; // Domingo 09:00, outros dias 08:00
      const maxTime = isSunday ? 780 : 1200; // Domingo 13:00, outros dias 20:00

      console.log(`Horário solicitado: ${time} (${requestedTime} min)`);
      console.log(`Expediente ${isSunday ? 'Domingo' : 'Segunda-Sábado'}: ${minTime}-${maxTime} min`);

      if (requestedTime < minTime || endTimeWithDuration > maxTime) {
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

      const dateStr = date.toISOString().split('T')[0];
      console.log(`Verificando conflitos para data: ${dateStr}, horário: ${time}`);

      for (const barber of allBarbers) {
        console.log(`Verificando barbeiro: ${barber.nome} (${barber.id})`);
        
        // Buscar agendamentos conflitantes na tabela painel_agendamentos
        const { data: conflicts, error: conflictError } = await supabase
          .from('painel_agendamentos')
          .select('id, data, hora, servico:painel_servicos(duracao)')
          .eq('barbeiro_id', barber.id)
          .eq('status', 'agendado')
          .eq('data', dateStr);

        if (conflictError) {
          console.error(`Erro ao verificar conflitos para ${barber.nome}:`, conflictError);
          // Em caso de erro, considerar disponível
          availableBarbersList.push({
            id: barber.id,
            name: barber.nome || 'Sem nome',
            email: barber.email || '',
            phone: barber.telefone || '',
            image_url: barber.image_url || '',
            specialties: barber.specialties || '',
            experience: barber.experience || '',
            role: barber.role || 'barbeiro',
            is_active: barber.is_active ?? true
          });
          continue;
        }

        // Verificar se há conflito de horário
        let hasConflict = false;
        if (conflicts && conflicts.length > 0) {
          hasConflict = conflicts.some(appointment => {
            const [appHours, appMinutes] = appointment.hora.split(':').map(Number);
            const appStart = new Date(startDateTime);
            appStart.setHours(appHours, appMinutes, 0, 0);
            const appDuration = (appointment.servico as any)?.duracao || 60;
            const appEnd = new Date(appStart);
            appEnd.setMinutes(appEnd.getMinutes() + appDuration);
            
            // Verificar sobreposição
            const overlap = startDateTime < appEnd && endDateTime > appStart;
            
            if (overlap) {
              console.log(`✗ Conflito para ${barber.nome}: ${appStart.toLocaleTimeString()} - ${appEnd.toLocaleTimeString()}`);
            }
            
            return overlap;
          });
        }

        if (!hasConflict) {
          availableBarbersList.push({
            id: barber.id,
            name: barber.nome || 'Sem nome',
            email: barber.email || '',
            phone: barber.telefone || '',
            image_url: barber.image_url || '',
            specialties: barber.specialties || '',
            experience: barber.experience || '',
            role: barber.role || 'barbeiro',
            is_active: barber.is_active ?? true
          });
          console.log(`✓ Barbeiro ${barber.nome} disponível`);
        } else {
          console.log(`✗ Barbeiro ${barber.nome} não disponível (conflito)`);
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
