import React, { useEffect, useState } from 'react';
import { Star, Users, TrendingUp, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

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
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-urbana-brown via-urbana-black to-urbana-brown">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-urbana-gold border-r-transparent"></div>
        </div>
      </section>
    );
  }

  if (stats.totalReviews === 0) {
    return null;
  }

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-urbana-brown via-urbana-black to-urbana-brown overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-40 left-20 w-96 h-96 bg-gradient-radial from-urbana-gold via-yellow-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-radial from-yellow-400 via-urbana-gold to-transparent rounded-full blur-3xl" />
      </div>

      {/* Geometric pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(30deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%), linear-gradient(150deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mx-auto mb-16 px-4"
        >
          <h2 
            className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight tracking-tight relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.3)'
            }}
          >
            O Que Nossos{" "}
            <span className="block md:inline text-urbana-light font-bold" style={{
              WebkitTextFillColor: '#f5f5f5',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              Clientes Dizem
            </span>
            {/* Decorative underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-urbana-gold to-transparent rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            />
          </h2>
          <p className="text-urbana-light/90 font-raleway text-xl md:text-2xl leading-relaxed font-light tracking-wide max-w-3xl mx-auto">
            Avaliações reais de quem já passou por aqui
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-6 lg:px-8">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative bg-urbana-black/70 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-2xl p-8 hover:border-urbana-gold transition-all duration-500 overflow-hidden hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)]">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Geometric pattern */}
              <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />

              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-urbana-gold via-yellow-400 to-amber-500 rounded-xl shadow-[0_8px_32px_rgba(255,215,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.2)] mb-4"
                  >
                    <Star className="w-10 h-10 text-urbana-black" />
                  </motion.div>
                  <div 
                    className="text-6xl font-bold font-playfair mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0 0 40px rgba(255, 215, 0, 0.3)'
                    }}
                  >
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
                  <p className="text-urbana-light/70 flex items-center justify-center gap-2 font-raleway">
                    <Users className="w-4 h-4" />
                    {stats.totalReviews} avaliações
                  </p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-3 mb-6">
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
                          <span className="text-urbana-light font-medium font-raleway">{rating}</span>
                          <Star className="w-4 h-4 text-urbana-gold fill-urbana-gold" />
                        </div>
                        <div className="flex-1 h-3 bg-urbana-black/50 rounded-full overflow-hidden border border-urbana-gold/10">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 + rating * 0.1 }}
                            viewport={{ once: true }}
                            className="h-full bg-gradient-to-r from-urbana-gold to-yellow-400 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                          />
                        </div>
                        <span className="text-urbana-light/70 w-12 text-right font-raleway">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-urbana-gold/20">
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 bg-gradient-to-br from-urbana-gold via-yellow-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-[0_4px_16px_rgba(255,215,0,0.3)]"
                    >
                      <TrendingUp className="w-6 h-6 text-urbana-black" />
                    </motion.div>
                    <div 
                      className="text-2xl font-bold font-playfair"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {Math.round(getPercentage(stats.fiveStarCount + stats.fourStarCount))}%
                    </div>
                    <div className="text-sm text-urbana-light/70 font-raleway">Satisfação</div>
                  </div>
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 bg-gradient-to-br from-urbana-gold via-yellow-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-[0_4px_16px_rgba(255,215,0,0.3)]"
                    >
                      <MessageCircle className="w-6 h-6 text-urbana-black" />
                    </motion.div>
                    <div 
                      className="text-2xl font-bold font-playfair"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {stats.recentReviews.length}
                    </div>
                    <div className="text-sm text-urbana-light/70 font-raleway">Com Comentário</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <div className="space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-urbana-light font-playfair">
              Avaliações Recentes
            </h3>
            
            {stats.recentReviews.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReviews.map((review, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative group"
                  >
                    <div className="relative bg-urbana-black/70 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-xl p-6 hover:border-urbana-gold transition-all duration-500 overflow-hidden hover:shadow-[0_10px_40px_rgba(255,215,0,0.2)]">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Geometric pattern */}
                      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                      }} />

                      <div className="relative z-10">
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
                        <p className="text-urbana-light/90 mb-3 italic font-raleway text-lg leading-relaxed">
                          "{review.comment}"
                        </p>
                        <p className="text-sm text-urbana-light/50 font-raleway">
                          {new Date(review.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative bg-urbana-black/70 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-xl p-8 text-center"
              >
                <p className="text-urbana-light/70 font-raleway text-lg">
                  Seja o primeiro a deixar um comentário!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};