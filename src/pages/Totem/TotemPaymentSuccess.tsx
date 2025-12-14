import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Receipt, Calendar, ArrowRight, Star } from 'lucide-react';
import { format, addWeeks, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client, total, paymentMethod, isDirect, transactionData } = location.state || {};
  
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  // Gerar datas sugeridas (3-4 semanas no futuro)
  const suggestedDates = React.useMemo(() => {
    const dates: Date[] = [];
    const now = new Date();
    
    // 3 semanas
    let date3w = addWeeks(now, 3);
    date3w = setHours(setMinutes(date3w, 0), 10); // 10:00
    dates.push(date3w);
    
    // 3.5 semanas
    let date35w = addWeeks(now, 3);
    date35w = new Date(date35w.getTime() + 3.5 * 24 * 60 * 60 * 1000);
    date35w = setHours(setMinutes(date35w, 0), 14); // 14:00
    dates.push(date35w);
    
    // 4 semanas
    let date4w = addWeeks(now, 4);
    date4w = setHours(setMinutes(date4w, 0), 11); // 11:00
    dates.push(date4w);
    
    return dates;
  }, []);

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    console.log('[PaymentSuccess] Dados recebidos:', { appointment, client, total, paymentMethod, isDirect, transactionData });
    
    if (!total || !client) {
      console.warn('[PaymentSuccess] Dados incompletos, redirecionando...');
      navigate('/totem/home');
      return;
    }

    // Auto-navegação após timeout (se não estiver agendando)
    let timer: NodeJS.Timeout;
    if (!showScheduler && !scheduled) {
      timer = setTimeout(() => {
        if (isDirect) {
          // Venda direta de produtos - voltar para home
          navigate('/totem/home');
        } else if (appointment) {
          // Serviço com agendamento - ir para avaliação
          navigate('/totem/rating', {
            state: { appointment, client }
          });
        } else {
          navigate('/totem/home');
        }
      }, 8000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, appointment, client, total, showScheduler, scheduled, isDirect]);

  const handleScheduleNext = async () => {
    if (!selectedDate || !appointment || isScheduling) return;
    
    setIsScheduling(true);
    
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: appointment.cliente_id,
          barbeiro_id: appointment.barbeiro_id,
          servico_id: appointment.servico_id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: format(selectedDate, 'HH:mm'),
          status: 'agendado',
          origem: 'totem'
        });

      if (error) throw error;

      toast.success('Próximo corte agendado!', {
        description: format(selectedDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
      });
      
      setScheduled(true);
      
      // Navegar após 3 segundos
      setTimeout(() => {
        navigate('/totem/rating', { state: { appointment, client } });
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast.error('Erro ao agendar', { description: 'Tente novamente ou agende pelo WhatsApp' });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSkipScheduling = () => {
    if (isDirect) {
      navigate('/totem/home');
    } else if (appointment) {
      navigate('/totem/rating', { state: { appointment, client } });
    } else {
      navigate('/totem/home');
    }
  };

  if (!total || !client) {
    return null;
  }

  const getPaymentMethodText = () => {
    if (paymentMethod === 'credit') return 'Cartão de Crédito';
    if (paymentMethod === 'debit') return 'Cartão de Débito';
    return 'PIX';
  };

  // Tela de agendamento do próximo corte
  if (showScheduler && !scheduled && appointment) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 md:p-6 font-poppins relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-brown/70 to-urbana-black/85" />
        </div>

        <div className="relative z-10 w-full max-w-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/50">
              <Calendar className="w-10 h-10 text-urbana-gold" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-urbana-gold">
              Agende seu próximo corte!
            </h2>
            <p className="text-lg md:text-xl text-urbana-light/80">
              Garanta seu horário com {appointment.barbeiro?.nome}
            </p>
          </div>

          <div className="grid gap-4">
            {suggestedDates.map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedDate?.getTime() === date.getTime()
                    ? 'border-urbana-gold bg-urbana-gold/20'
                    : 'border-urbana-gold/30 bg-black/30 hover:bg-urbana-gold/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-urbana-gold">
                      {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-lg text-urbana-light/80">
                      às {format(date, 'HH:mm')}
                    </p>
                  </div>
                  {selectedDate?.getTime() === date.getTime() && (
                    <CheckCircle className="w-8 h-8 text-urbana-gold" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleScheduleNext}
              disabled={!selectedDate || isScheduling}
              size="lg"
              className="flex-1 h-14 md:h-16 text-lg md:text-xl bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold"
            >
              {isScheduling ? 'Agendando...' : 'Confirmar Agendamento'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              onClick={handleSkipScheduling}
              variant="outline"
              size="lg"
              className="h-14 md:h-16 text-lg border-urbana-gold/50 text-urbana-light hover:bg-urbana-gold/10"
            >
              Pular
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de sucesso do agendamento
  if (scheduled) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 md:p-6 font-poppins relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-brown/70 to-urbana-black/85" />
        </div>

        <div className="relative z-10 text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500">
            <Calendar className="w-12 h-12 text-green-400" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-green-400">
              Próximo corte agendado! ✅
            </h2>
            {selectedDate && (
              <p className="text-xl md:text-2xl text-urbana-light">
                {format(selectedDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            <p className="text-lg text-urbana-light/60">
              Você receberá uma confirmação por WhatsApp
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-urbana-gold">
            <Star className="w-5 h-5 animate-pulse" />
            <span className="text-lg">Preparando avaliação...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-brown/70 to-urbana-black/80" />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/20 via-urbana-brown/10 to-urbana-black/20 z-0" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: '1s' }} />

      <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-xl sm:max-w-2xl md:max-w-4xl w-full z-10 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-green-400/20">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message with Client Name */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300">
            Obrigado, {client.nome?.split(' ')[0]}! 🎉
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-urbana-light/90 font-semibold">
            Pagamento Confirmado!
          </p>
          
          {transactionData?.nsu && (
            <p className="text-sm text-urbana-light/60">
              NSU: {transactionData.nsu}
            </p>
          )}
        </div>

        {/* Receipt - Compacto */}
        <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-urbana-gold border-b border-urbana-gold/30 pb-2">
            <Receipt className="w-4 h-4" />
            RECIBO
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-urbana-light/60">Data:</span>
              <span className="text-urbana-light">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
            </div>
            
            {appointment?.servico?.nome && (
              <div className="flex justify-between">
                <span className="text-urbana-light/60">Serviço:</span>
                <span className="text-urbana-light">{appointment.servico.nome}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-urbana-light/60">Pagamento:</span>
              <span className="text-urbana-light">{getPaymentMethodText()}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-urbana-gold/30">
              <span className="text-lg font-bold text-urbana-light">TOTAL:</span>
              <span className="text-xl font-black text-urbana-gold">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {appointment && !isDirect && (
            <Button
              onClick={() => setShowScheduler(true)}
              size="lg"
              className="flex-1 h-14 text-lg bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold hover:opacity-90"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Próximo Corte
            </Button>
          )}
          
          <Button
            onClick={handleSkipScheduling}
            variant="outline"
            size="lg"
            className={`h-14 text-lg border-urbana-gold/50 text-urbana-light hover:bg-urbana-gold/10 ${!appointment || isDirect ? 'flex-1' : ''}`}
          >
            {appointment && !isDirect ? (
              <>
                <Star className="w-5 h-5 mr-2" />
                Avaliar Atendimento
              </>
            ) : (
              'Voltar ao Início'
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-base sm:text-lg text-urbana-gold font-bold pt-2">
          Costa Urbana Barbearia ✂️
        </p>
      </div>
    </div>
  );
};

export default TotemPaymentSuccess;
