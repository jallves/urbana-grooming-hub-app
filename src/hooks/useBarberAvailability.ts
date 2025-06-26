
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
        
        // Verificar conflitos de agendamento
        const isAvailable = await checkBarberAvailabilityManual(barber.id, date, time, duration);
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

  const checkBarberAvailabilityManual = async (
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

      console.log(`  Horário solicitado: ${startDateTime.toISOString()} até ${endDateTime.toISOString()}`);

      // Verificar conflitos com agendamentos existentes - consulta mais precisa
      const { data: conflicts, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status')
        .eq('staff_id', barberId)
        .in('status', ['scheduled', 'confirmed'])
        .or(`and(start_time.lt.${endDateTime.toISOString()},end_time.gt.${startDateTime.toISOString()})`);

      if (error) {
        console.error(`  Erro ao verificar conflitos para ${barberId}:`, error);
        // Em caso de erro, considerar disponível para não bloquear
        return true;
      }

      const hasConflicts = conflicts && conflicts.length > 0;
      console.log(`  Conflitos encontrados: ${conflicts?.length || 0}`);
      
      if (hasConflicts) {
        console.log(`  Conflitos:`, conflicts?.map(c => ({ 
          id: c.id, 
          start: c.start_time, 
          end: c.end_time,
          status: c.status
        })));
      }

      return !hasConflicts;
    } catch (error) {
      console.error(`Erro na verificação manual para ${barberId}:`, error);
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
