
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { useClientAuth } from '@/contexts/ClientAuthContext';

export const useClientAppointmentsList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { client } = useClientAuth();
  
  const fetchAppointments = useCallback(async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching client appointments for:', client.id);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(*),
          service:service_id(*),
          staff:staff_id(*)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching client appointments:', error);
        throw error;
      }
      
      console.log('Client appointments found:', data?.length || 0);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error("Não foi possível carregar seus agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchAppointments();
      
      // Add real-time subscription for appointments with proper cleanup
      const channel = supabase
        .channel('client-appointment-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'appointments',
            filter: `client_id=eq.${client.id}`
          },
          (payload) => {
            console.log('Client appointment data changed:', payload);
            fetchAppointments(); // Refresh data when changes occur
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up client appointments subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [client, fetchAppointments]);

  return {
    appointments,
    isLoading,
    fetchAppointments
  };
};
