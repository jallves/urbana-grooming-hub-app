
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

export const useClientDashboardRealtime = (onUpdate: () => void) => {
  const { cliente } = usePainelClienteAuth();

  useEffect(() => {
    if (!cliente?.id) return;

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
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente?.id, onUpdate]);
};
