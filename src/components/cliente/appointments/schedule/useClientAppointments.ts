
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface UseClientAppointmentsProps {
  date: Date;
  viewMode: 'day' | 'week';
}

export const useClientAppointments = ({ date, viewMode }: UseClientAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useClientAuth();

  const fetchAppointments = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(*),
          service:service_id(*),
          staff:staff_id(*)
        `)
        .eq('client_id', client.id);
        
      if (viewMode === 'day') {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        query = query
          .gte('start_time', dayStart.toISOString())
          .lte('start_time', dayEnd.toISOString());
      } else {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        
        query = query
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos', {
        description: 'Não foi possível carregar seus agendamentos. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [date, viewMode, client]);

  return {
    appointments,
    isLoading,
    fetchAppointments
  };
};
