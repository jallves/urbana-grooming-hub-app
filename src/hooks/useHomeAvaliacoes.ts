import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'success' | 'error';

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  recentReviews: Array<{
    rating: number;
    comment: string;
    created_at: string;
    client_name?: string;
    barber_name?: string;
  }>;
}

const initialStats: ReviewStats = {
  totalReviews: 0,
  averageRating: 0,
  fiveStarCount: 0,
  fourStarCount: 0,
  threeStarCount: 0,
  twoStarCount: 0,
  oneStarCount: 0,
  recentReviews: []
};

/**
 * Hook para avaliações - busca dados reais do banco de dados
 */
export const useHomeAvaliacoes = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<ReviewStats>(initialStats);
  const [error, setError] = useState<string | null>(null);

  const fetchAvaliacoes = useCallback(async () => {
    try {
      setStatus('loading');
      console.log('[useHomeAvaliacoes] Buscando avaliações do banco...');

      // Buscar todas as avaliações
      const { data: ratings, error: ratingsError } = await supabase
        .from('appointment_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client_id,
          barber_id
        `)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('[useHomeAvaliacoes] Erro ao buscar avaliações:', ratingsError);
        throw ratingsError;
      }

      console.log('[useHomeAvaliacoes] Avaliações encontradas:', ratings?.length || 0);

      if (!ratings || ratings.length === 0) {
        // Sem avaliações ainda - manter valores zerados
        setData(initialStats);
        setStatus('success');
        return;
      }

      // Calcular estatísticas
      const totalReviews = ratings.length;
      const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

      const fiveStarCount = ratings.filter(r => r.rating === 5).length;
      const fourStarCount = ratings.filter(r => r.rating === 4).length;
      const threeStarCount = ratings.filter(r => r.rating === 3).length;
      const twoStarCount = ratings.filter(r => r.rating === 2).length;
      const oneStarCount = ratings.filter(r => r.rating === 1).length;

      // Buscar avaliações recentes com comentários (últimas 5)
      const recentWithComments = ratings
        .filter(r => r.comment && r.comment.trim() !== '')
        .slice(0, 5);

      // Buscar nomes dos clientes e barbeiros para os comentários recentes
      const clientIds = [...new Set(recentWithComments.map(r => r.client_id).filter(Boolean))];
      const barberIds = [...new Set(recentWithComments.map(r => r.barber_id).filter(Boolean))];

      let clientsMap: Record<string, string> = {};
      let barbersMap: Record<string, string> = {};

      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('painel_clientes')
          .select('id, nome')
          .in('id', clientIds);
        
        if (clients) {
          clientsMap = clients.reduce((acc, c) => ({ ...acc, [c.id]: c.nome }), {});
        }
      }

      if (barberIds.length > 0) {
        const { data: barbers } = await supabase
          .from('painel_barbeiros')
          .select('id, nome')
          .in('id', barberIds);
        
        if (barbers) {
          barbersMap = barbers.reduce((acc, b) => ({ ...acc, [b.id]: b.nome }), {});
        }
      }

      const recentReviews = recentWithComments.map(r => ({
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at,
        client_name: r.client_id ? clientsMap[r.client_id] : undefined,
        barber_name: r.barber_id ? barbersMap[r.barber_id] : undefined
      }));

      const stats: ReviewStats = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        twoStarCount,
        oneStarCount,
        recentReviews
      };

      console.log('[useHomeAvaliacoes] Estatísticas calculadas:', {
        total: totalReviews,
        media: stats.averageRating,
        comentarios: recentReviews.length
      });

      setData(stats);
      setStatus('success');
      setError(null);

    } catch (err: any) {
      console.error('[useHomeAvaliacoes] Erro:', err);
      setError(err.message || 'Erro ao carregar avaliações');
      setStatus('error');
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  // Escutar mudanças em tempo real
  useEffect(() => {
    console.log('[useHomeAvaliacoes] Configurando listener realtime...');
    
    const channel = supabase
      .channel('homepage-ratings')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointment_ratings'
        },
        (payload) => {
          console.log('[useHomeAvaliacoes] Mudança detectada:', payload.eventType);
          // Refetch quando houver mudanças
          fetchAvaliacoes();
        }
      )
      .subscribe((status) => {
        console.log('[useHomeAvaliacoes] Realtime status:', status);
      });

    return () => {
      console.log('[useHomeAvaliacoes] Removendo listener realtime');
      supabase.removeChannel(channel);
    };
  }, [fetchAvaliacoes]);

  return { status, data, error, refetch: fetchAvaliacoes };
};
