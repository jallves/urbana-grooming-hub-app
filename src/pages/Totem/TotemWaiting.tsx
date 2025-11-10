import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, User, Scissors, TrendingUp, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTotemTimeout } from '@/hooks/useTotemTimeout';

/**
 * Tela de espera inteligente após check-in
 * Fase 2 e 3: Experiência Premium com informações em tempo real
 */
const TotemWaiting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, appointment, session } = location.state || {};
  
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>(0);

  // Timeout de inatividade
  useTotemTimeout({
    timeoutMinutes: 10, // Tempo maior para espera
    enabled: true,
  });

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !appointment) {
      navigate('/totem/home');
      return;
    }

    // Calcular posição na fila e tempo estimado
    calculateQueueInfo();

    // Atualizar em tempo real via Supabase Realtime
    const channel = supabase
      .channel('totem_waiting')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'totem_sessions',
          filter: `barbeiro_id=eq.${appointment.barbeiro_id}`,
        },
        () => {
          calculateQueueInfo();
        }
      )
      .subscribe();

    return () => {
      document.documentElement.classList.remove('totem-mode');
      channel.unsubscribe();
    };
  }, [client, appointment, navigate]);

  const calculateQueueInfo = async () => {
    if (!appointment) return;

    try {
      // Contar check-ins válidos sem checkout (em atendimento ou aguardando)
      const { data: sessionsAhead, error } = await supabase
        .from('totem_sessions')
        .select('id, check_in_time, appointment_id(servico_id(duracao))')
        .in('status', ['check_in', 'in_service'])
        .lt('check_in_time', session?.check_in_time || new Date().toISOString())
        .order('check_in_time', { ascending: true });

      if (!error && sessionsAhead) {
        setQueuePosition(sessionsAhead.length);
        
        // Calcular tempo real baseado na duração de cada serviço na fila
        let totalWaitTime = 0;
        sessionsAhead.forEach((s: any) => {
          const duration = s.appointment_id?.servico_id?.duracao || 30;
          totalWaitTime += duration;
        });
        
        setEstimatedWaitTime(totalWaitTime);
      }
    } catch (error) {
      console.error('Erro ao calcular fila:', error);
    }
  };

  if (!client || !appointment) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-brown/40 to-urbana-black/85" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light drop-shadow-lg">Aguarde Confortavelmente</h1>
          <p className="text-urbana-light/70 text-sm sm:text-base md:text-lg mt-1 sm:mt-2">
            <User className="inline w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            {client.nome}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/totem/home')}
          className="bg-white/5 backdrop-blur-md border-2 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/20 hover:border-urbana-gold/60 text-sm sm:text-base h-10 sm:h-11 md:h-12 transition-all duration-300"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Início
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 overflow-y-auto pb-4">
        {/* Left Column: Queue Info */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Queue Position Card */}
          <Card className="bg-black/15 backdrop-blur-xl border-2 border-urbana-gold/20 p-4 sm:p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-urbana-gold/40 transition-all duration-300">
            <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/50 backdrop-blur-sm">
                <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold drop-shadow-lg" />
              </div>
              
              <div>
                <p className="text-urbana-gold/80 text-sm sm:text-base md:text-lg mb-1 sm:mb-2 font-medium">Posição na fila</p>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-urbana-gold drop-shadow-lg">
                  {queuePosition === 0 ? 'Próximo' : queuePosition}
                </p>
              </div>

              {queuePosition > 0 && (
                <p className="text-urbana-gold/70 text-base sm:text-lg md:text-xl font-light">
                  {queuePosition === 1 ? '1 pessoa' : `${queuePosition} pessoas`} à sua frente
                </p>
              )}
            </div>
          </Card>

          {/* Estimated Time Card */}
          <Card className="bg-black/15 backdrop-blur-xl border-2 border-urbana-gold/20 p-4 sm:p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-urbana-gold/40 transition-all duration-300">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-urbana-gold/15 backdrop-blur-sm flex items-center justify-center border border-urbana-gold/30">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold drop-shadow-lg" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-urbana-gold/80 text-xs sm:text-sm md:text-base mb-1 font-medium">Tempo estimado</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-gold drop-shadow-lg">
                  {estimatedWaitTime === 0 ? 'Agora' : `${estimatedWaitTime} min`}
                </p>
              </div>
            </div>
          </Card>

          {/* Service Info Card */}
          <Card className="bg-black/15 backdrop-blur-xl border-2 border-urbana-gold/20 p-4 sm:p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-urbana-gold/40 transition-all duration-300">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Scissors className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold flex-shrink-0 drop-shadow-lg" />
                <div>
                  <p className="text-urbana-gold/80 text-xs sm:text-sm font-medium">Serviço</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-gold drop-shadow-lg">
                    {appointment.servico?.nome}
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-urbana-gold/20" />
              
              <div className="flex items-center gap-3 sm:gap-4">
                <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold flex-shrink-0 drop-shadow-lg" />
                <div>
                  <p className="text-urbana-gold/80 text-xs sm:text-sm font-medium">Barbeiro</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-gold drop-shadow-lg">
                    {appointment.barbeiro?.nome}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Tips Card */}
          <Card className="bg-black/15 backdrop-blur-xl border-2 border-urbana-gold/20 p-4 sm:p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-urbana-gold/40 transition-all duration-300">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-gold mb-3 sm:mb-4 drop-shadow-lg">
              Dicas de Cuidados
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-urbana-gold/70 text-xs sm:text-sm md:text-base lg:text-lg">
              <li className="flex items-start gap-2 sm:gap-3 hover:text-urbana-gold transition-colors duration-200">
                <span className="text-urbana-gold flex-shrink-0 font-bold text-base sm:text-lg">✓</span>
                <span>Lave o cabelo 1-2 vezes por semana</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 hover:text-urbana-gold transition-colors duration-200">
                <span className="text-urbana-gold flex-shrink-0 font-bold text-base sm:text-lg">✓</span>
                <span>Use produtos adequados ao seu tipo de cabelo</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 hover:text-urbana-gold transition-colors duration-200">
                <span className="text-urbana-gold flex-shrink-0 font-bold text-base sm:text-lg">✓</span>
                <span>Mantenha a barba hidratada diariamente</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 hover:text-urbana-gold transition-colors duration-200">
                <span className="text-urbana-gold flex-shrink-0 font-bold text-base sm:text-lg">✓</span>
                <span>Agende seu próximo corte a cada 3-4 semanas</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-3 sm:mt-4 md:mt-6 text-center pb-2 sm:pb-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/15 backdrop-blur-md border border-urbana-gold/20 rounded-full shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-urbana-gold/70 text-sm sm:text-base md:text-lg font-light">
            Você será notificado quando for sua vez
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemWaiting;
