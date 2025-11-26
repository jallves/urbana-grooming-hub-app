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

const filterProfanity = (text: string): boolean => {
  const profanityList = [
    'porra', 'caralho', 'merda', 'puta', 'foda', 'cu', 'cacete', 'buceta',
    'viado', 'idiota', 'imbecil', 'desgraça', 'fdp', 'arrombado', 'pqp',
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'bastard', 'cunt'
  ];
  
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
};

export const useHomeAvaliacoes = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<ReviewStats>(initialStats);
  const [error, setError] = useState<string | null>(null);

  const fetchAvaliacoes = useCallback(async () => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    setStatus('loading');
    setError(null);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout ao carregar avaliações'));
        }, 8000);
      });

      const fetchPromise = supabase
        .from('appointment_ratings')
        .select('rating, comment, created_at')
        .order('created_at', { ascending: false });

      const { data: ratings, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      clearTimeout(timeoutId!);

      if (cancelled) return;

      if (fetchError) {
        console.error('[Avaliações Hook] Erro:', fetchError.message);
        setError('Não foi possível carregar as avaliações.');
        setData(initialStats);
        setStatus('error');
      } else if (ratings && ratings.length > 0) {
        const totalReviews = ratings.length;
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        
        const fiveStarCount = ratings.filter(r => r.rating === 5).length;
        const fourStarCount = ratings.filter(r => r.rating === 4).length;
        const threeStarCount = ratings.filter(r => r.rating === 3).length;
        const twoStarCount = ratings.filter(r => r.rating === 2).length;
        const oneStarCount = ratings.filter(r => r.rating === 1).length;

        const recentReviews = ratings
          .filter(r => r.comment && r.comment.trim() !== '' && !filterProfanity(r.comment))
          .slice(0, 3);

        setData({
          totalReviews,
          averageRating,
          fiveStarCount,
          fourStarCount,
          threeStarCount,
          twoStarCount,
          oneStarCount,
          recentReviews
        });
        setStatus('success');
      } else {
        setData(initialStats);
        setStatus('success');
      }
    } catch (err: any) {
      if (cancelled) return;
      console.error('[Avaliações Hook] Exceção:', err?.message);
      setError(err?.message || 'Erro ao carregar avaliações.');
      setData(initialStats);
      setStatus('error');
    }

    return () => {
      cancelled = true;
      if (timeoutId!) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    fetchAvaliacoes();

    // Real-time subscription
    const channel = supabase
      .channel('reviews-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_ratings'
        },
        () => {
          console.log('[Avaliações Hook] Atualização em tempo real');
          fetchAvaliacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvaliacoes]);

  const refetch = useCallback(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  return { status, data, error, refetch };
};
