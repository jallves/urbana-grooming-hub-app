
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

export const useClientAppointments = (clientId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(*),
          service:service_id(*),
          barber:staff_id(*)
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento excluído",
        description: "Seu agendamento foi excluído com sucesso.",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchAppointments();
    }
  }, [clientId]);

  return {
    appointments,
    loading,
    fetchAppointments,
    cancelAppointment,
    deleteAppointment
  };
};
