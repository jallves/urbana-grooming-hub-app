import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Home, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TotemRating: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client } = location.state || {};
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !client) {
      navigate('/totem/home');
    }
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [appointment, client, navigate]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecione uma avaliação', {
        description: 'Por favor, escolha de 1 a 5 estrelas'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('appointment_ratings')
        .insert({
          appointment_id: appointment.id,
          client_id: client.id,
          barber_id: appointment.barbeiro_id,
          rating: rating,
          comment: comment || null
        });

      if (error) throw error;

      setSubmitted(true);
      
      toast.success('Avaliação enviada!', {
        description: 'Obrigado pelo seu feedback! Ele nos ajuda a melhorar.'
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/totem/home');
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/totem/home');
  };

  if (!appointment || !client) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <Card className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-6 sm:p-8 md:p-12 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-green-500/50 shadow-2xl shadow-green-500/20 animate-scale-in">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-green-500/20 border-2 border-green-500/40">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400 fill-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light mb-2 sm:mb-3">
                Avaliação Enviada! ✓
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-urbana-light/70">
                Obrigado pelo seu feedback, {client.nome}!
              </p>
            </div>

            <div className="pt-4 sm:pt-6">
              <p className="text-sm sm:text-base md:text-lg text-urbana-light/60">
                Redirecionando para o início...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 z-10">
        <div className="flex-1" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 text-center animate-shimmer" style={{ backgroundSize: '200% auto' }}>
          Avalie seu Atendimento
        </h1>
        <div className="flex-1 flex justify-end">
          <Button
            onClick={handleSkip}
            variant="ghost"
            size="lg"
            className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light/60 hover:text-urbana-light"
          >
            Pular
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 md:space-y-8 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl animate-scale-in">
          {/* Greeting */}
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-purple-500/20 mb-2 sm:mb-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">
              Como foi seu atendimento, {client.nome}?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-urbana-light/60">
              Sua opinião é muito importante para nós!
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200 active:scale-90"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Star
                    className={cn(
                      'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 transition-all duration-200',
                      (hoveredRating >= star || rating >= star)
                        ? 'text-yellow-400 fill-yellow-400 scale-110'
                        : 'text-urbana-gray-light'
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-base sm:text-lg md:text-xl text-urbana-gold font-semibold animate-fade-in">
                {rating === 5 && 'Excelente! ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'Muito Bom! ⭐⭐⭐⭐'}
                {rating === 3 && 'Bom ⭐⭐⭐'}
                {rating === 2 && 'Regular ⭐⭐'}
                {rating === 1 && 'Podemos melhorar ⭐'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
              Deixe um comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] text-sm sm:text-base md:text-lg bg-urbana-black/60 border-urbana-gold/30 focus:border-urbana-gold text-urbana-light placeholder:text-urbana-light/40 resize-none"
              maxLength={500}
            />
            <p className="text-xs sm:text-sm text-urbana-light/40 text-right">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:from-urbana-gray disabled:to-urbana-gray-light"
            >
              {isSubmitting ? (
                <>
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 sm:flex-none h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2" />
              <span className="hidden sm:inline">Voltar ao Início</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemRating;
