
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminRealtimeNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up admin real-time notifications');

    const channel = supabase
      .channel('admin_appointments_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          console.log('Admin: Appointment update received:', payload);
          
          // Notificar quando agendamento for finalizado
          if (payload.new?.status === 'concluido' && payload.old?.status !== 'concluido') {
            toast({
              title: "🎉 Agendamento Finalizado",
              description: "Um agendamento foi marcado como concluído pelo barbeiro.",
              duration: 5000,
            });
          }
          
          // Notificar quando agendamento for cancelado
          if (payload.new?.status === 'cancelado' && payload.old?.status !== 'cancelado') {
            toast({
              title: "❌ Agendamento Cancelado",
              description: "Um agendamento foi cancelado.",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin real-time notifications');
      supabase.removeChannel(channel);
    };
  }, [toast]);
};
