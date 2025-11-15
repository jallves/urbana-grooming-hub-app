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
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-background via-urbana-black to-background">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Sem background, apenas efeitos sutis */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-40 left-20 w-96 h-96 bg-gradient-radial from-urbana-gold via-urbana-gold/50 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-radial from-urbana-gold/50 via-urbana-gold to-transparent rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(30deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%), linear-gradient(150deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mx-auto mb-16 px-4"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight tracking-tight relative inline-block">
            <span className="bg-gradient-to-r from-urbana-gold via-urbana-gold/80 to-urbana-gold bg-clip-text text-transparent">
              O Que Nossos
            </span>{" "}
            <span className="block md:inline text-urbana-light drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]">
              Clientes Dizem
            </span>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-urbana-gold to-transparent rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            />
          </h2>
          <p className="text-urbana-light/70 font-raleway text-xl md:text-2xl leading-relaxed font-light tracking-wide max-w-3xl mx-auto">
            {stats.totalReviews > 0 ? 'Avaliações reais de quem já passou por aqui' : 'Seja o primeiro a avaliar nossos serviços'}
          </p>
        </motion.div>

        {stats.totalReviews === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-4"
          >
            <div className="relative bg-transparent backdrop-blur-xl border-2 border-urbana-gold/30 rounded-3xl p-12 hover:border-urbana-gold/50 transition-all duration-500 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-urbana-gold/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-12 h-12 text-urbana-gold" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-playfair font-bold text-urbana-light mb-4">
                  Queremos Ouvir Você!
                </h3>
                
                <p className="text-urbana-light/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
                  Sua opinião é muito importante para nós. Após seu próximo atendimento, 
                  compartilhe sua experiência e ajude outros clientes a conhecerem nosso trabalho.
                </p>
                
                <div className="flex flex-wrap justify-center gap-8 text-sm text-urbana-light/70">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-urbana-gold rounded-full" />
                    <span>Avaliação rápida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>100% anônimo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Sua voz importa</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative bg-background/40 backdrop-blur-xl border-2 border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all duration-500 overflow-hidden hover:shadow-[0_20px_60px_hsl(var(--primary)/0.3),0_0_80px_hsl(var(--primary)/0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.8) 1px, transparent 0)',
                  backgroundSize: '32px 32px'
                }} />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-primary/80 to-primary rounded-xl shadow-[0_8px_32px_hsl(var(--primary)/0.4),inset_0_2px_8px_rgba(255,255,255,0.2)] mb-4"
                    >
                      <Star className="w-10 h-10 text-primary-foreground" />
                    </motion.div>
                    <div className="text-6xl font-bold font-playfair mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(stats.averageRating)
                              ? 'text-primary fill-primary'
                              : 'text-primary/30'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground flex items-center justify-center gap-2 font-raleway">
                      <Users className="w-4 h-4" />
                      {stats.totalReviews} avaliações
                    </p>
                  </div>

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
                          <div className="flex-1 bg-urbana-light/20 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: rating * 0.1 }}
                              viewport={{ once: true }}
                              className="h-full bg-gradient-to-r from-urbana-gold to-urbana-gold/60 rounded-full shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                            />
                          </div>
                          <span className="text-urbana-light/70 font-raleway text-sm w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-urbana-gold/30">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-urbana-gold" />
                        <span className="text-2xl font-bold text-urbana-light font-playfair">
                          {Math.round((stats.fiveStarCount / stats.totalReviews) * 100)}%
                        </span>
                      </div>
                      <p className="text-urbana-light/70 text-sm font-raleway">Satisfação</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-urbana-gold" />
                        <span className="text-2xl font-bold text-urbana-light font-playfair">
                          {stats.recentReviews.length}
                        </span>
                      </div>
                      <p className="text-urbana-light/70 text-sm font-raleway">Com comentário</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-playfair font-bold text-urbana-light mb-6 flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-urbana-gold" />
                Comentários Recentes
              </h3>

              {stats.recentReviews.length > 0 ? (
                stats.recentReviews.map((review, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative bg-transparent backdrop-blur-xl border-2 border-urbana-gold/30 rounded-xl p-6 hover:border-urbana-gold/50 transition-all duration-300 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-primary fill-primary'
                                : 'text-primary/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-foreground font-raleway leading-relaxed mb-3">
                        "{review.comment}"
                      </p>
                      <p className="text-muted-foreground text-sm font-raleway">
                        {new Date(review.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative bg-background/40 backdrop-blur-xl border-2 border-border/50 rounded-xl p-8 text-center"
                >
                  <p className="text-muted-foreground font-raleway text-lg">
                    Seja o primeiro a deixar um comentário!
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};
