import React, { useEffect, useState } from 'react';
import { Star, Users, TrendingUp, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

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

export const ClientReviews: React.FC = () => {
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
    recentReviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewStats();

    // Realtime updates
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
          fetchReviewStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviewStats = async () => {
    try {
      const { data: ratings, error } = await supabase
        .from('appointment_ratings')
        .select('rating, comment, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ratings && ratings.length > 0) {
        const totalReviews = ratings.length;
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        
        const fiveStarCount = ratings.filter(r => r.rating === 5).length;
        const fourStarCount = ratings.filter(r => r.rating === 4).length;
        const threeStarCount = ratings.filter(r => r.rating === 3).length;
        const twoStarCount = ratings.filter(r => r.rating === 2).length;
        const oneStarCount = ratings.filter(r => r.rating === 1).length;

        // Get recent reviews with comments
        const recentReviews = ratings
          .filter(r => r.comment && r.comment.trim() !== '')
          .slice(0, 3);

        setStats({
          totalReviews,
          averageRating,
          fiveStarCount,
          fourStarCount,
          threeStarCount,
          twoStarCount,
          oneStarCount,
          recentReviews
        });
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="w-full py-12 sm:py-16 md:py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (stats.totalReviews === 0) {
    return null;
  }

  return (
    <div className="w-full py-12 sm:py-16 md:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-urbana-light mb-3 sm:mb-4">
          O Que Nossos Clientes Dizem
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-urbana-light/70">
          Avaliações reais de quem já passou por aqui
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Stats Overview */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-urbana-brown/20 to-urbana-black/40 border-urbana-gold/20 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-urbana-gold/20 mb-4">
              <Star className="w-10 h-10 text-urbana-gold fill-urbana-gold" />
            </div>
            <div className="text-5xl font-bold text-urbana-gold mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(stats.averageRating)
                      ? 'text-urbana-gold fill-urbana-gold'
                      : 'text-urbana-gold/30'
                  }`}
                />
              ))}
            </div>
            <p className="text-urbana-light/70 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {stats.totalReviews} avaliações
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = rating === 5 ? stats.fiveStarCount :
                           rating === 4 ? stats.fourStarCount :
                           rating === 3 ? stats.threeStarCount :
                           rating === 2 ? stats.twoStarCount :
                           stats.oneStarCount;
              const percentage = getPercentage(count);

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-urbana-light font-medium">{rating}</span>
                    <Star className="w-4 h-4 text-urbana-gold fill-urbana-gold" />
                  </div>
                  <div className="flex-1 h-3 bg-urbana-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-urbana-gold to-urbana-gold-light transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-urbana-light/70 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-urbana-gold/20">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-urbana-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-urbana-gold">
                {Math.round(getPercentage(stats.fiveStarCount + stats.fourStarCount))}%
              </div>
              <div className="text-sm text-urbana-light/70">Satisfação</div>
            </div>
            <div className="text-center">
              <MessageCircle className="w-6 h-6 text-urbana-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-urbana-gold">
                {stats.recentReviews.length}
              </div>
              <div className="text-sm text-urbana-light/70">Com Comentário</div>
            </div>
          </div>
        </Card>

        {/* Recent Reviews */}
        <div className="space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4">
            Avaliações Recentes
          </h3>
          
          {stats.recentReviews.length > 0 ? (
            <div className="space-y-4">
              {stats.recentReviews.map((review, index) => (
                <Card
                  key={index}
                  className="p-4 sm:p-6 bg-gradient-to-br from-urbana-brown/20 to-urbana-black/40 border-urbana-gold/20 backdrop-blur-sm hover:border-urbana-gold/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.rating
                            ? 'text-urbana-gold fill-urbana-gold'
                            : 'text-urbana-gold/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-urbana-light/90 mb-2 italic">"{review.comment}"</p>
                  <p className="text-sm text-urbana-light/50">
                    {new Date(review.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-urbana-brown/20 to-urbana-black/40 border-urbana-gold/20">
              <p className="text-center text-urbana-light/70">
                Seja o primeiro a deixar um comentário!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
