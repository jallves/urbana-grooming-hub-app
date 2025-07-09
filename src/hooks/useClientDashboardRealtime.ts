
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

export const useClientDashboardRealtime = (onUpdate: () => void) => {
  const { cliente } = usePainelClienteAuth();

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
            // Usar uma notificação do sistema se disponível
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Agendamento Finalizado!', {
                body: 'Seu atendimento foi concluído com sucesso.',
                icon: '/favicon.ico'
              });
            }
          }
          
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [cliente?.id, onUpdate]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};
