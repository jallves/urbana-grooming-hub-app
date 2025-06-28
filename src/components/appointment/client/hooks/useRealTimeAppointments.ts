
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  barber: {
    id: string;
    name: string;
    image_url: string;
  };
}

export const useRealTimeAppointments = (clientId: string | undefined) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAppointments = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      console.log('Carregando agendamentos para cliente:', clientId);
      
      // Consultar appointments com joins corretos às tabelas certas
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          service:services (
            id,
            name,
            price,
            duration
          ),
          barber:barbers!appointments_staff_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Erro ao carregar agendamentos:', error);
        throw error;
      }

      console.log('Agendamentos carregados:', data?.length || 0);
      setAppointments(data as Appointment[]);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`client-appointments-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Real-time appointment update:', payload);
          
          // Reload appointments on any change
          loadAppointments();
          
          // Show appropriate notifications
          if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any)?.status;
            const oldStatus = (payload.old as any)?.status;
            
            if (newStatus !== oldStatus) {
              toast({
                title: "Status atualizado",
                description: `Seu agendamento foi ${newStatus === 'confirmed' ? 'confirmado' : 
                  newStatus === 'cancelled' ? 'cancelado' : 'atualizado'}.`,
              });
            }
          } else if (payload.eventType === 'INSERT') {
            toast({
              title: "Novo agendamento",
              description: "Um novo agendamento foi criado.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, loadAppointments, toast]);

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

      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    appointments,
    loading,
    loadAppointments,
    cancelAppointment
  };
};
