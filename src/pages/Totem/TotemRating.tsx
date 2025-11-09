import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Home, Sparkles, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemRating: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client } = location.state || {};
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showScheduleQuestion, setShowScheduleQuestion] = useState(false);
  const [countdown, setCountdown] = useState(10);

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !client) {
      navigate('/totem/home');
    }
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [appointment, client, navigate]);

  // Countdown timer para voltar ao início
  React.useEffect(() => {
    if (showScheduleQuestion && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showScheduleQuestion && countdown === 0) {
      navigate('/totem/home');
    }
  }, [showScheduleQuestion, countdown, navigate]);

  const handleScheduleYes = () => {
    navigate('/totem/search', { 
      state: { 
        action: 'novo-agendamento',
        client 
      } 
    });
  };

  const handleScheduleNo = () => {
    navigate('/totem/home');
  };

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

      // Mostrar pergunta sobre agendamento
      setShowScheduleQuestion(true);
      
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

  if (showScheduleQuestion) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={barbershopBg} 
            alt="Barbearia" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/75 to-urbana-brown/70" />
        </div>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Glassmorphism Card - Transparente mas legível */}
        <Card className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-6 sm:p-8 md:p-12 bg-white/5 backdrop-blur-2xl border-2 border-urbana-gold/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(212,175,55,0.15)] animate-scale-in rounded-3xl overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 via-transparent to-purple-500/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/20 to-transparent pointer-events-none" />
          
          {/* Content with proper z-index */}
          <div className="relative z-10 text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-urbana-gold/30 backdrop-blur-sm border-2 border-urbana-gold/50 shadow-lg shadow-urbana-gold/20">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold drop-shadow-lg" />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" style={{
                textShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8)'
              }}>
                {client.nome.split(' ')[0]}, deseja agendar<br />seu próximo corte?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Garanta já seu horário para a próxima visita!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleScheduleYes}
                className="flex-1 h-14 sm:h-16 md:h-20 text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:from-yellow-500 hover:via-urbana-gold hover:to-yellow-500 text-urbana-black shadow-[0_8px_24px_rgba(212,175,55,0.4)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.6)] transition-all duration-300 hover:scale-105 border-2 border-yellow-400/30"
              >
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 mr-2 drop-shadow" />
                Sim, quero agendar!
              </Button>

              <Button
                onClick={handleScheduleNo}
                variant="outline"
                className="flex-1 h-14 sm:h-16 md:h-20 text-lg sm:text-xl md:text-2xl border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/60 shadow-lg transition-all duration-300"
              >
                <Home className="w-6 h-6 sm:w-7 sm:h-7 mr-2" />
                Não, obrigado
              </Button>
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-sm sm:text-base text-white/70 drop-shadow-lg">
                Voltando ao início em <span className="text-urbana-gold font-bold text-lg drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">{countdown}</span> segundos...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={barbershopBg} 
            alt="Barbearia" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/75 to-urbana-brown/70" />
        </div>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Glassmorphism Card - Transparente mas legível */}
        <Card className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-6 sm:p-8 md:p-12 bg-white/5 backdrop-blur-2xl border-2 border-green-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(16,185,129,0.2)] animate-scale-in rounded-3xl overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-urbana-gold/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/20 to-transparent pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-green-500/30 backdrop-blur-sm border-2 border-green-500/50 shadow-lg shadow-green-500/20">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400 fill-green-400 drop-shadow-lg" />
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" style={{
                textShadow: '0 0 40px rgba(16, 185, 129, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8)'
              }}>
                Avaliação Enviada! ✓
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Obrigado pelo seu feedback, {client.nome.split(' ')[0]}!
              </p>
            </div>

            <div className="pt-4 sm:pt-6">
              <p className="text-sm sm:text-base md:text-lg text-white/70 drop-shadow-lg">
                Preparando próxima etapa...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/75 to-urbana-brown/70" />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden z-0">
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
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 md:space-y-8 bg-gradient-to-br from-urbana-black-soft/60 to-urbana-black/40 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl animate-scale-in">
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
              className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] text-sm sm:text-base md:text-lg bg-urbana-black-soft/50 border-purple-500/30 focus:border-purple-500 text-urbana-light placeholder:text-urbana-light/40 resize-none backdrop-blur-md"
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
              className="flex-1 sm:flex-none h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl border-purple-500/30 text-urbana-light hover:bg-purple-500/10 backdrop-blur-md"
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
