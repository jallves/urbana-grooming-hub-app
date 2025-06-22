import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types/appointment';

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
          id,
          client_id,
          service_id,
          staff_id,
          start_time,
          end_time,
          status,
          notes,
          coupon_code,
          discount_amount,
          created_at,
          updated_at,
          service:service_id (
            id,
            name,
            price,
            duration,
            description,
            is_active,
            created_at,
            updated_at
          ),
          staff:staff_id (
            id,
            name,
            specialties,
            email,
            phone,
            image_url,
            experience,
            commission_rate,
            is_active,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus agendamentos",
          variant: "destructive",
        });
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar agendamentos",
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

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso",
      });

      // Atualizar lista
      await fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento",
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

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });

      // Atualizar lista
      await fetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchAppointments();
    }
  }, [clientId]);

  // Separar agendamentos futuros e histórico
  const now = new Date();
  const futureAppointments = appointments.filter(
    app => new Date(app.start_time) > now && app.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(
    app => new Date(app.start_time) <= now || app.status === 'cancelled'
  );

  return {
    appointments,
    futureAppointments,
    pastAppointments,
    loading,
    cancelAppointment,
    deleteAppointment,
    refetch: fetchAppointments
  };
};
