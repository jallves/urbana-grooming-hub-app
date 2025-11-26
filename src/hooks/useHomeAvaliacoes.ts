import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let cancelled = false;

    const fetchAvaliacoes = async () => {
      setStatus('loading');
      setError(null);

      try {
        const { data: ratings, error: fetchError } = await supabase
          .from('appointment_ratings')
          .select('rating, comment, created_at')
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (fetchError) {
          console.error('[Avaliações Hook] Erro:', fetchError.message);
          setData(initialStats);
          setStatus('success');
        } else if (ratings && ratings.length > 0) {
          console.log('[Avaliações Hook] ✅ Carregadas:', ratings.length, 'avaliações');
          
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
          console.log('[Avaliações Hook] ⚠️ Vazio');
          setData(initialStats);
          setStatus('success');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('[Avaliações Hook] Exceção:', err?.message);
        setData(initialStats);
        setStatus('success');
      }
    };

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
          if (!cancelled) fetchAvaliacoes();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      const { data: ratings, error: fetchError } = await supabase
        .from('appointment_ratings')
        .select('rating, comment, created_at')
        .order('created_at', { ascending: false });

      if (fetchError || !ratings || ratings.length === 0) {
        setData(initialStats);
        setStatus('success');
        return;
      }

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
    } catch {
      setData(initialStats);
      setStatus('success');
    }
  };

  return { status, data, error, refetch };
};
