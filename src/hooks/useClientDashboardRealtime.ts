
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useClientDashboardRealtime = (onUpdate: () => void) => {
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!cliente?.id) return;

    console.log('Setting up real-time subscription for client:', cliente.id);

    const channel = supabase
      .channel('client_appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `cliente_id=eq.${cliente.id}`
        },
        (payload) => {
          console.log('Client appointment update received:', payload);
          
          // Mostrar notificação quando agendamento for finalizado
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'concluido') {
            toast({
              title: "🎉 Atendimento Finalizado!",
              description: "Seu agendamento foi marcado como concluído.",
              duration: 5000,
            });

            // Usar uma notificação do sistema se disponível
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Agendamento Finalizado!', {
                body: 'Seu atendimento foi concluído com sucesso.',
                icon: '/favicon.ico'
              });
            }
          }

          // Mostrar notificação quando agendamento for cancelado
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'cancelado') {
            toast({
              title: "❌ Agendamento Cancelado",
              description: "Seu agendamento foi cancelado.",
              duration: 5000,
            });
          }
          
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [cliente?.id, onUpdate, toast]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};
