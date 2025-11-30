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
  satisfiedClients: 400,
  servicesCompleted: 700,
  positiveRating: 99.0
};

export const useHomeStatistics = () => {
  const [stats, setStats] = useState<HomeStatistics>(BASE_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      // Buscar contagem de avaliações 5 estrelas (clientes satisfeitos)
      const { count: fiveStarCount } = await supabase
        .from('appointment_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('rating', 5);

      // Buscar contagem de serviços concluídos
      const { count: completedServices } = await supabase
        .from('painel_agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido');

      // Buscar média de avaliações para calcular percentual
      const { data: ratingsData } = await supabase
        .from('appointment_ratings')
        .select('rating');

      // Calcula a média e converte para percentual
      let avgRating = BASE_STATS.positiveRating;
      if (ratingsData && ratingsData.length > 0) {
        const totalRatings = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const avgValue = totalRatings / ratingsData.length;
        // Converte a média (1-5) para percentual (0-100)
        // 5 estrelas = 100%, 4 estrelas = 80%, etc.
        avgRating = Math.min(100, Math.max(BASE_STATS.positiveRating, (avgValue / 5) * 100));
      }

      setStats({
        yearsOfExcellence: BASE_STATS.yearsOfExcellence,
        satisfiedClients: BASE_STATS.satisfiedClients + (fiveStarCount || 0),
        servicesCompleted: BASE_STATS.servicesCompleted + (completedServices || 0),
        positiveRating: Number(avgRating.toFixed(1))
      });
    } catch (error) {
      console.error('[Statistics] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

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
          fetchStatistics();
        }
      )
      .subscribe();

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

    return () => {
      supabase.removeChannel(ratingsChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, []);

  return { stats, loading, refetch: fetchStatistics };
};
