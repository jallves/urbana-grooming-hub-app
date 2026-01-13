
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
      // Verificar se há barbeiros específicos vinculados a este serviço
      const { data: serviceStaff, error: staffError } = await supabase
        .from('service_staff')
        .select('staff_id')
        .eq('service_id', serviceId);

      let query = supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .eq('ativo', true)
        .order('nome');

      // Se há barbeiros vinculados, filtrar apenas eles
      if (!staffError && serviceStaff && serviceStaff.length > 0) {
        const staffIds = serviceStaff.map(s => s.staff_id);
        query = query.in('id', staffIds);
        console.log('Barbeiros vinculados ao serviço:', staffIds.length);
      } else {
        console.log('Sem vínculo específico - buscando todos os barbeiros ativos');
      }

      const { data: allBarbers, error: barbersError } = await query;

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
      const dayOfWeek = date.getDay();
      console.log(`3. Verificando dia da semana: ${dayOfWeek} (0=domingo)`);
      
      const isSunday = dayOfWeek === 0;
      const [hours, minutes] = time.split(':').map(Number);
      const requestedTime = hours * 60 + minutes;
      const endTimeWithDuration = requestedTime + duration;

      const minTime = isSunday ? 540 : 480;
      const maxTime = isSunday ? 780 : 1200;

      console.log(`Horário solicitado: ${time} (${requestedTime} min)`);

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
        
        const { data: conflicts, error: conflictError } = await supabase
          .from('painel_agendamentos')
          .select('id, data, hora, servico:painel_servicos(duracao)')
          .eq('barbeiro_id', barber.id)
          .eq('status', 'agendado')
          .eq('data', dateStr);

        if (conflictError) {
          console.error(`Erro ao verificar conflitos para ${barber.nome}:`, conflictError);
          availableBarbersList.push({
            id: barber.id,
            name: barber.nome || 'Sem nome',
            email: barber.email || '',
            phone: barber.telefone || '',
            image_url: barber.image_url || '',
            specialties: Array.isArray(barber.specialties) ? barber.specialties.join(', ') : (barber.specialties || ''),
            experience: barber.experience || '',
            role: barber.role || 'barbeiro',
            is_active: barber.is_active ?? true
          });
          continue;
        }

        let hasConflict = false;
        if (conflicts && conflicts.length > 0) {
          hasConflict = conflicts.some(appointment => {
            const [appHours, appMinutes] = appointment.hora.split(':').map(Number);
            const appStart = new Date(startDateTime);
            appStart.setHours(appHours, appMinutes, 0, 0);
            const appDuration = (appointment.servico as any)?.duracao || 60;
            const appEnd = new Date(appStart);
            appEnd.setMinutes(appEnd.getMinutes() + appDuration);
            
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
            specialties: Array.isArray(barber.specialties) ? barber.specialties.join(', ') : (barber.specialties || ''),
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
      
      // Use check_barber_slot_availability instead
      const dateStr = startTime.toISOString().split('T')[0];
      const timeStr = startTime.toTimeString().slice(0, 5);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      const { data, error } = await supabase.rpc('check_barber_slot_availability', {
        p_barber_id: staffId,
        p_date: dateStr,
        p_time: timeStr,
        p_duration: duration
      });

      if (error) {
        console.error('Erro na validação:', error);
        return { valid: false, error: 'Erro na validação do agendamento' };
      }

      return { valid: data === true, error: data ? undefined : 'Horário indisponível' };
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
