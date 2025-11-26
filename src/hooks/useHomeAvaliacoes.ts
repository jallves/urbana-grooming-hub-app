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

const calculateStats = (ratings: any[]): ReviewStats => {
  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;
  
  const fiveStarCount = ratings.filter(r => r.rating === 5).length;
  const fourStarCount = ratings.filter(r => r.rating === 4).length;
  const threeStarCount = ratings.filter(r => r.rating === 3).length;
  const twoStarCount = ratings.filter(r => r.rating === 2).length;
  const oneStarCount = ratings.filter(r => r.rating === 1).length;

  const recentReviews = ratings
    .filter(r => r.comment && r.comment.trim() !== '' && !filterProfanity(r.comment))
    .slice(0, 3);

  return {
    totalReviews,
    averageRating,
    fiveStarCount,
    fourStarCount,
    threeStarCount,
    twoStarCount,
    oneStarCount,
    recentReviews
  };
};

export const useHomeAvaliacoes = () => {
  const [status, setStatus] = useState<Status>('success');
  const [data, setData] = useState<ReviewStats>(initialStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAvaliacoes = async () => {
      try {
        const { data: ratings, error: fetchError } = await supabase
          .from('appointment_ratings')
          .select('rating, comment, created_at')
          .order('created_at', { ascending: false });

        if (!mounted) return;

        if (fetchError) {
          console.error('[Avaliações] Erro ao carregar:', fetchError.message);
        } else if (ratings && ratings.length > 0) {
          console.log('[Avaliações] ✅ Carregadas:', ratings.length);
          setData(calculateStats(ratings));
        } else {
          setData(initialStats);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('[Avaliações] Exceção:', err?.message);
      }
    };

    fetchAvaliacoes();

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
          if (mounted) fetchAvaliacoes();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = async () => {
    try {
      const { data: ratings, error: fetchError } = await supabase
        .from('appointment_ratings')
        .select('rating, comment, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Avaliações] Erro no refetch:', fetchError.message);
      } else if (ratings && ratings.length > 0) {
        setData(calculateStats(ratings));
      } else {
        setData(initialStats);
      }
    } catch (err: any) {
      console.error('[Avaliações] Exceção no refetch:', err?.message);
    }
  };

  return { status, data, error, refetch };
};
