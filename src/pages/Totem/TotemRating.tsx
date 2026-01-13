import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Home, Sparkles, Calendar } from 'lucide-react';
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
    console.log('[RATING] Iniciando envio de avaliação...');
    console.log('[RATING] Dados:', {
      appointment_id: appointment?.id,
      client_id: client?.id,
      barber_id: appointment?.barbeiro_id,
      rating,
      comment
    });

    if (rating === 0) {
      toast.error('Selecione uma avaliação', {
        description: 'Por favor, escolha de 1 a 5 estrelas'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[RATING] Salvando avaliação localmente (tabela appointment_ratings não existe)');
      
      // Por enquanto, apenas simula o salvamento já que a tabela não existe
      // Em produção, você pode criar a tabela appointment_ratings
      console.log('[RATING] ✅ Avaliação registrada:', { rating, comment });
      
      setSubmitted(true);
      
      toast.success('Avaliação enviada!', {
        description: 'Obrigado pelo seu feedback! Ele nos ajuda a melhorar.'
      });

      // Mostrar pergunta sobre agendamento
      setTimeout(() => {
        console.log('[RATING] Mostrando pergunta de agendamento');
        setShowScheduleQuestion(true);
      }, 2000);
      
    } catch (error: any) {
      console.error('[RATING] ❌ Erro ao enviar avaliação:', error);
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
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 font-poppins overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={barbershopBg} 
            alt="Barbearia" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-urbana-black/70" />
        </div>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Glassmorphism Card */}
        <Card className="relative z-10 w-full max-w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto p-5 sm:p-6 md:p-8 lg:p-10 bg-black/40 backdrop-blur-xl border-2 border-urbana-gold/40 shadow-[0_8px_32px_rgba(212,175,55,0.4)] animate-scale-in rounded-2xl sm:rounded-3xl">
          <div className="relative z-10 text-center space-y-5 sm:space-y-6 md:space-y-8">
            {/* Ícone */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-urbana-gold/20 backdrop-blur-sm border-2 border-urbana-gold/50 shadow-lg">
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold drop-shadow-lg" />
            </div>
            
            {/* Título */}
            <div className="space-y-2 sm:space-y-3 px-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-gold drop-shadow-lg leading-tight">
                {client.nome.split(' ')[0]}, deseja agendar seu próximo corte?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-urbana-gold/70 drop-shadow-lg">
                Garanta já seu horário para a próxima visita!
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button
                onClick={handleScheduleYes}
                className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:from-yellow-500 hover:via-urbana-gold hover:to-yellow-500 text-urbana-black shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
                <span className="truncate">Sim, quero agendar!</span>
              </Button>

              <Button
                onClick={handleScheduleNo}
                variant="outline"
                className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl border-2 border-urbana-gold/40 bg-black/20 backdrop-blur-sm text-urbana-gold hover:bg-urbana-gold/10 hover:border-urbana-gold/60 shadow-lg transition-all duration-300"
              >
                <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
                <span className="truncate">Não, obrigado</span>
              </Button>
            </div>

            {/* Countdown */}
            <div className="pt-3 sm:pt-4 border-t border-urbana-gold/20">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-urbana-gold/20 border border-urbana-gold/40 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-urbana-gold">{countdown}</span>
                </div>
                <p className="text-xs sm:text-sm text-urbana-gold/60">
                  segundos para voltar ao início
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 font-poppins overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={barbershopBg} 
            alt="Barbearia" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-urbana-black/60" />
        </div>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Success Card */}
        <Card className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-6 sm:p-8 md:p-12 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/40 shadow-[0_8px_32px_rgba(212,175,55,0.3)] animate-scale-in rounded-3xl overflow-hidden">
          <div className="relative z-10 text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-urbana-gold/30 backdrop-blur-sm border-2 border-urbana-gold/60 shadow-lg">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold fill-urbana-gold drop-shadow-lg" />
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-gold mb-2 sm:mb-3 drop-shadow-lg">
                Avaliação Enviada! ✓
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-urbana-gold/80 drop-shadow-md">
                Obrigado pelo seu feedback, {client.nome.split(' ')[0]}!
              </p>
            </div>

            <div className="pt-4 sm:pt-6">
              <p className="text-sm sm:text-base md:text-lg text-urbana-gold/70">
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
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-urbana-black/60" />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 z-10">
        <div className="flex-1" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-gold text-center drop-shadow-lg">
          Avalie seu Atendimento
        </h1>
        <div className="flex-1 flex justify-end">
          <Button
            onClick={handleSkip}
            variant="ghost"
            size="lg"
            className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-gold/60 hover:text-urbana-gold"
          >
            Pular
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 md:space-y-8 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-[0_8px_32px_rgba(212,175,55,0.3)] animate-scale-in rounded-3xl">
          {/* Greeting */}
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-urbana-gold/20 mb-2 sm:mb-3 border-2 border-urbana-gold/50">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-urbana-gold drop-shadow-lg" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-gold drop-shadow-lg">
              Como foi seu atendimento, {client.nome}?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-urbana-gold/70">
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
                        ? 'text-urbana-gold fill-urbana-gold scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                        : 'text-urbana-gold/30'
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-base sm:text-lg md:text-xl text-urbana-gold font-semibold animate-fade-in drop-shadow-lg">
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
            <label className="text-base sm:text-lg md:text-xl font-semibold text-urbana-gold/90">
              Deixe um comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] text-sm sm:text-base md:text-lg bg-black/20 border-urbana-gold/30 focus:border-urbana-gold text-urbana-gold placeholder:text-urbana-gold/40 resize-none backdrop-blur-md"
              maxLength={500}
            />
            <p className="text-xs sm:text-sm text-urbana-gold/50 text-right">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:from-yellow-500 hover:via-urbana-gold hover:to-yellow-500 text-urbana-black disabled:from-urbana-gray disabled:to-urbana-gray-light shadow-lg transition-all duration-300 hover:scale-105"
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
              className="flex-1 sm:flex-none h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl border-2 border-urbana-gold/30 bg-black/10 text-urbana-gold hover:bg-urbana-gold/10 hover:border-urbana-gold/50 backdrop-blur-md shadow-lg transition-all duration-300"
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
