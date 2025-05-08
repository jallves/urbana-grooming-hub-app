
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

interface UseAppointmentsProps {
  date: Date;
  viewMode: 'day' | 'week';
}

export const useAppointments = ({ date, viewMode }: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(*),
          service:service_id(*)
        `);
        
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
        description: 'Não foi possível carregar os agendamentos. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [date, viewMode]);

  return {
    appointments,
    isLoading,
    fetchAppointments
  };
};
