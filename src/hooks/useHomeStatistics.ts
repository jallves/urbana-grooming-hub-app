import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomeStatistics {
  yearsOfExcellence: number;
  satisfiedClients: number;
  servicesCompleted: number;
  positiveRating: number;
}

// Valores base definidos pelo cliente
const BASE_STATS = {
  yearsOfExcellence: 2,
  satisfiedClients: 401,
  servicesCompleted: 700,
  positiveRating: 0
};

export const useHomeStatistics = () => {
  const [stats, setStats] = useState<HomeStatistics>(BASE_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      // Buscar contagem de serviços concluídos
      const { count: completedServices } = await supabase
        .from('painel_agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido');

      // Buscar contagem de clientes únicos
      const { count: uniqueClients } = await supabase
        .from('painel_clientes')
        .select('*', { count: 'exact', head: true });

      // Buscar avaliações para calcular a taxa de satisfação real
      const { data: ratings, error: ratingsError } = await supabase
        .from('appointment_ratings')
        .select('rating');

      let positiveRating = BASE_STATS.positiveRating;

      if (!ratingsError && ratings && ratings.length > 0) {
        // Cada estrela = 20%, então média × 20 = percentual
        // Ex: média 5 estrelas = 100%, média 4 = 80%, média 3 = 60%
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        positiveRating = Math.round(averageRating * 20 * 10) / 10;
        console.log('[Statistics] Média:', averageRating.toFixed(2), '=', positiveRating, '%');
      }

      setStats({
        yearsOfExcellence: BASE_STATS.yearsOfExcellence,
        satisfiedClients: BASE_STATS.satisfiedClients + (uniqueClients || 0),
        servicesCompleted: BASE_STATS.servicesCompleted + (completedServices || 0),
        positiveRating
      });
    } catch (error) {
      console.error('[Statistics] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Realtime para agendamentos
    const appointmentsChannel = supabase
      .channel('appointments_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        () => {
          fetchStatistics();
        }
      )
      .subscribe();

    // Realtime para avaliações
    const ratingsChannel = supabase
      .channel('ratings_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_ratings'
        },
        () => {
          console.log('[Statistics] Nova avaliação detectada, atualizando...');
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(ratingsChannel);
    };
  }, []);

  return { stats, loading, refetch: fetchStatistics };
};
