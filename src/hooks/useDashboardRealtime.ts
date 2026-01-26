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
          queryClient.invalidateQueries({ queryKey: ['top-barbers-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['financial-evolution-chart'] });
          queryClient.invalidateQueries({ queryKey: ['operational-metrics-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_receber'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-contas-receber-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['totais-contas-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_pagar'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-contas-pagar-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['totais-contas-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['operational-metrics-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
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
          queryClient.invalidateQueries({ queryKey: ['operational-metrics-dashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
