import React from 'react';
import { Star, Users, TrendingUp, MessageCircle, RefreshCw } from 'lucide-react';
import { useHomeAvaliacoes } from '@/hooks/useHomeAvaliacoes';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const ClientReviews: React.FC = () => {
  const { status, data: stats, error, refetch } = useHomeAvaliacoes();

  const getPercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  // Loading state - skeleton
  if (status === 'loading') {
    return (
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="w-full relative z-10">
          <div className="text-center mb-16 px-4">
            <h2 className="text-5xl md:text-6xl font-playfair font-bold mb-6 text-urbana-gold">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-urbana-light/70 text-xl">Carregando conteúdo...</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-6 lg:px-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-96 bg-urbana-black/80 rounded-2xl animate-pulse border-2 border-urbana-gold/30"
                style={{
                  background: 'linear-gradient(90deg, rgba(30,30,30,0.8) 25%, rgba(50,50,50,0.8) 50%, rgba(30,30,30,0.8) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="w-full relative z-10">
          <div className="text-center mb-16 px-4">
            <h2 className="text-5xl md:text-6xl font-playfair font-bold mb-6 text-urbana-gold">
              O Que Nossos Clientes Dizem
            </h2>
          </div>
          
          <div className="max-w-md mx-auto text-center px-4">
            <div className="w-20 h-20 bg-urbana-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-urbana-gold" />
            </div>
            <p className="text-urbana-gold/70 mb-6">{error || 'Não foi possível carregar este conteúdo agora.'}</p>
            <Button
              onClick={refetch}
              className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Success state
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
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
            <div className="relative bg-urbana-black/90 backdrop-blur-xl border-2 border-urbana-gold/50 rounded-3xl p-12 hover:border-urbana-gold transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)] group">
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
                    <div className="w-2 h-2 bg-urbana-gold rounded-full" />
                    <span>100% anônimo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-urbana-gold rounded-full" />
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
              <div className="relative bg-urbana-black/90 backdrop-blur-xl border-2 border-urbana-gold/50 rounded-2xl p-8 hover:border-urbana-gold transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 via-transparent to-urbana-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-urbana-gold/10 rounded-xl mb-4"
                    >
                      <Star className="w-10 h-10 text-urbana-gold" />
                    </motion.div>
                    <div className="text-6xl font-bold font-playfair mb-2 text-urbana-gold">
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
                    <p className="text-urbana-gold/80 flex items-center justify-center gap-2 font-raleway">
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
                            <span className="text-urbana-gold font-medium font-raleway">{rating}</span>
                            <Star className="w-4 h-4 text-urbana-gold fill-urbana-gold" />
                          </div>
                          <div className="flex-1 bg-urbana-gold/20 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: rating * 0.1 }}
                              viewport={{ once: true }}
                              className="h-full bg-gradient-to-r from-urbana-gold to-urbana-gold/60 rounded-full shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                            />
                          </div>
                          <span className="text-urbana-gold/70 font-raleway text-sm w-12 text-right">
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
                        <span className="text-2xl font-bold text-urbana-gold font-playfair">
                          {Math.round((stats.fiveStarCount / stats.totalReviews) * 100)}%
                        </span>
                      </div>
                      <p className="text-urbana-gold/70 text-sm font-raleway">Satisfação</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-urbana-gold" />
                        <span className="text-2xl font-bold text-urbana-gold font-playfair">
                          {stats.recentReviews.length}
                        </span>
                      </div>
                      <p className="text-urbana-gold/70 text-sm font-raleway">Com comentário</p>
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
                    className="relative bg-urbana-black/90 backdrop-blur-xl border-2 border-urbana-gold/50 rounded-xl p-6 hover:border-urbana-gold transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)] group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 via-transparent to-urbana-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-urbana-gold fill-urbana-gold'
                                : 'text-urbana-gold/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-urbana-gold font-raleway leading-relaxed mb-3">
                        "{review.comment}"
                      </p>
                      <p className="text-urbana-gold/70 text-sm font-raleway">
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
                  className="relative bg-urbana-black/70 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-xl p-8 text-center"
                >
                  <p className="text-urbana-gold/70 font-raleway text-lg">
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
