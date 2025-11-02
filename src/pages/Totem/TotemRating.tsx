import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, ThumbsUp, Send, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TotemFeedback } from '@/components/totem/TotemFeedback';

/**
 * Sistema de avaliação pós-atendimento
 * Fase 2: Feedback do cliente
 */
const TotemRating: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { appointment, client } = location.state || {};
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !client) {
      navigate('/totem/home');
      return;
    }

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [appointment, client, navigate]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avalie o atendimento",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('appointment_ratings').insert({
        appointment_id: appointment.id,
        client_id: client.id,
        barber_id: appointment.barbeiro_id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/totem/home');
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente",
        variant: "destructive",
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
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center p-6 font-poppins">
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black opacity-50" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <TotemFeedback
            type="success"
            title="Obrigado pelo feedback!"
            message="Sua opinião é muito importante para nós"
            size="xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-6 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-gold/5 to-urbana-black opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />

      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/40 mb-6">
          <Sparkles className="w-10 h-10 text-urbana-gold" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-urbana-light mb-3">
          Como foi seu atendimento?
        </h1>
        <p className="text-xl text-urbana-light/60">
          Sua opinião nos ajuda a melhorar sempre
        </p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl bg-urbana-black-soft border-2 border-urbana-gold/20 p-10">
          {/* Rating Stars */}
          <div className="mb-10">
            <p className="text-center text-xl text-urbana-light/70 mb-6">
              Avalie de 1 a 5 estrelas
            </p>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-16 h-16 md:w-20 md:h-20 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-urbana-gold text-urbana-gold'
                        : 'text-urbana-light/20'
                    }`}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-6 text-2xl font-semibold text-urbana-gold animate-fade-in">
                {rating === 5 && 'Excelente! ⭐'}
                {rating === 4 && 'Muito Bom! 👍'}
                {rating === 3 && 'Bom'}
                {rating === 2 && 'Regular'}
                {rating === 1 && 'Pode melhorar'}
              </p>
            )}
          </div>

          {/* Comment (Optional) */}
          <div className="mb-8">
            <label className="block text-lg text-urbana-light/70 mb-4">
              Quer deixar um comentário? (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos sobre sua experiência..."
              className="min-h-[120px] text-lg bg-urbana-black border-urbana-gold/30 text-urbana-light placeholder:text-urbana-light/30 resize-none"
              maxLength={500}
            />
            <p className="text-right text-sm text-urbana-light/40 mt-2">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              className="flex-1 text-lg py-6 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10"
              disabled={isSubmitting}
            >
              <Home className="w-5 h-5 mr-2" />
              Pular
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 text-lg py-6 bg-urbana-gold text-urbana-black hover:bg-urbana-gold-light"
            >
              {isSubmitting ? (
                <>
                  <ThumbsUp className="w-5 h-5 mr-2 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemRating;
