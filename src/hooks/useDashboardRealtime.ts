import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_records'
        },
        () => {
          // Invalidate all dashboard-related queries
          queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['pending-accounts-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['top-barbers-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['financial-evolution-chart'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['pending-accounts-dashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
