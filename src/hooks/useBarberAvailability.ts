
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
    console.log('Buscando barbeiros disponíveis:', { serviceId, date, time, duration });
    setIsLoading(true);
    
    try {
      // Primeiro, vamos buscar todos os barbeiros ativos
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

      console.log('Todos os barbeiros encontrados:', allBarbers);

      // Agora vamos verificar disponibilidade usando a função RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_barbers', {
        p_service_id: serviceId,
        p_date: date.toISOString().split('T')[0],
        p_time: time,
        p_duration: duration
      });

      if (rpcError) {
        console.error('Erro na função RPC:', rpcError);
        // Se a função RPC falhar, vamos usar uma verificação manual
        console.log('Usando verificação manual de disponibilidade...');
        
        const availableBarbersList: AvailableBarber[] = [];
        
        for (const barber of allBarbers || []) {
          // Verificação básica - se não há horário de trabalho definido, considera disponível
          const isAvailable = await checkBarberAvailabilityManual(barber.id, date, time, duration);
          
          if (isAvailable) {
            availableBarbersList.push({
              id: barber.id,
              name: barber.name || '',
              email: barber.email || '',
              phone: barber.phone || '',
              image_url: barber.image_url || '',
              specialties: barber.specialties || '',
              experience: barber.experience || '',
              role: barber.role || 'barber',
              is_active: barber.is_active
            });
          }
        }
        
        console.log('Barbeiros disponíveis (verificação manual):', availableBarbersList);
        setAvailableBarbers(availableBarbersList);
        return;
      }

      console.log('Barbeiros disponíveis (RPC):', rpcData);
      setAvailableBarbers(rpcData || []);

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
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      // Verificar conflitos com agendamentos existentes
      const { data: conflicts, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', barberId)
        .gte('start_time', startDateTime.toISOString())
        .lt('start_time', endDateTime.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Erro ao verificar conflitos:', error);
        return true; // Em caso de erro, considera disponível
      }

      return !conflicts || conflicts.length === 0;
    } catch (error) {
      console.error('Erro na verificação manual:', error);
      return true; // Em caso de erro, considera disponível
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
