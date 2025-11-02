import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, User, Scissors, TrendingUp, Star, Home } from 'lucide-react';
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
  const [barberGallery, setBarberGallery] = useState<string[]>([]);

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

    // Buscar galeria do barbeiro
    fetchBarberGallery();

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
      // Contar quantos clientes estão na frente
      const { data: sessionsAhead, error } = await supabase
        .from('totem_sessions')
        .select('id, check_in_time')
        .eq('status', 'check_in')
        .lt('check_in_time', session?.check_in_time || new Date().toISOString())
        .order('check_in_time', { ascending: true });

      if (!error && sessionsAhead) {
        setQueuePosition(sessionsAhead.length);
        
        // Estimar tempo: duração do serviço * quantidade de pessoas na frente
        const serviceDuration = appointment.servico?.duracao || 30;
        setEstimatedWaitTime(serviceDuration * sessionsAhead.length);
      }
    } catch (error) {
      console.error('Erro ao calcular fila:', error);
    }
  };

  const fetchBarberGallery = async () => {
    if (!appointment?.barbeiro_id) return;

    try {
      const { data: barber } = await supabase
        .from('painel_barbeiros')
        .select('image_url')
        .eq('id', appointment.barbeiro_id)
        .single();

      // Por enquanto, usar a imagem do barbeiro
      // No futuro, buscar de uma tabela de galeria
      if (barber?.image_url) {
        setBarberGallery([barber.image_url]);
      }
    } catch (error) {
      console.error('Erro ao buscar galeria:', error);
    }
  };

  if (!client || !appointment) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black opacity-50" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">Aguarde Confortavelmente</h1>
          <p className="text-urbana-light/60 text-sm sm:text-base md:text-lg mt-1">
            <User className="inline w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            {client.nome}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/totem/home')}
          className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 text-sm sm:text-base h-10 sm:h-11 md:h-12"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Início
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 overflow-y-auto">
        {/* Left Column: Queue Info */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Queue Position Card */}
          <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/30 p-4 sm:p-6 md:p-8">
            <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/40">
                <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
              </div>
              
              <div>
                <p className="text-urbana-light/60 text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Posição na fila</p>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-gold">
                  {queuePosition === 0 ? 'Próximo' : queuePosition}
                </p>
              </div>

              {queuePosition > 0 && (
                <p className="text-urbana-light/70 text-base sm:text-lg md:text-xl">
                  {queuePosition === 1 ? '1 pessoa' : `${queuePosition} pessoas`} à sua frente
                </p>
              )}
            </div>
          </Card>

          {/* Estimated Time Card */}
          <Card className="bg-urbana-black-soft border-urbana-gold/20 p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-urbana-gold/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-urbana-light/60 text-xs sm:text-sm md:text-base mb-1">Tempo estimado</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light">
                  {estimatedWaitTime === 0 ? 'Agora' : `${estimatedWaitTime} min`}
                </p>
              </div>
            </div>
          </Card>

          {/* Service Info Card */}
          <Card className="bg-urbana-black-soft border-urbana-gold/20 p-4 sm:p-6 md:p-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Scissors className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold flex-shrink-0" />
                <div>
                  <p className="text-urbana-light/60 text-xs sm:text-sm">Serviço</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-gold">
                    {appointment.servico?.nome}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold flex-shrink-0" />
                <div>
                  <p className="text-urbana-light/60 text-xs sm:text-sm">Barbeiro</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light">
                    {appointment.barbeiro?.nome}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Barber Gallery */}
          {barberGallery.length > 0 && (
            <Card className="bg-urbana-black-soft border-urbana-gold/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
                Trabalhos Recentes
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {barberGallery.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-urbana-gold/20"
                  >
                    <img
                      src={image}
                      alt={`Trabalho ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-urbana-brown/20 to-urbana-brown-light/10 border-urbana-gold/20 p-4 sm:p-6 md:p-8">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-3 sm:mb-4">
              Dicas de Cuidados
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-urbana-light/70 text-xs sm:text-sm md:text-base lg:text-lg">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-urbana-gold flex-shrink-0">✓</span>
                <span>Lave o cabelo 1-2 vezes por semana</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-urbana-gold flex-shrink-0">✓</span>
                <span>Use produtos adequados ao seu tipo de cabelo</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-urbana-gold flex-shrink-0">✓</span>
                <span>Mantenha a barba hidratada diariamente</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-urbana-gold flex-shrink-0">✓</span>
                <span>Agende seu próximo corte a cada 3-4 semanas</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-3 sm:mt-4 md:mt-6 text-center">
        <p className="text-urbana-light/40 text-sm sm:text-base md:text-lg">
          Você será notificado quando for sua vez
        </p>
      </div>
    </div>
  );
};

export default TotemWaiting;
