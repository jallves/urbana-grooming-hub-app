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
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-6 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black opacity-50" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-urbana-light">Aguarde Confortavelmente</h1>
          <p className="text-urbana-light/60 text-lg mt-1">
            <User className="inline w-5 h-5 mr-2" />
            {client.nome}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/totem/home')}
          className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
        >
          <Home className="w-5 h-5 mr-2" />
          Início
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Queue Info */}
        <div className="space-y-6">
          {/* Queue Position Card */}
          <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/30 p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/40">
                <TrendingUp className="w-10 h-10 text-urbana-gold" />
              </div>
              
              <div>
                <p className="text-urbana-light/60 text-lg mb-2">Posição na fila</p>
                <p className="text-6xl font-bold text-urbana-gold">
                  {queuePosition === 0 ? 'Próximo' : queuePosition}
                </p>
              </div>

              {queuePosition > 0 && (
                <p className="text-urbana-light/70 text-xl">
                  {queuePosition === 1 ? '1 pessoa' : `${queuePosition} pessoas`} à sua frente
                </p>
              )}
            </div>
          </Card>

          {/* Estimated Time Card */}
          <Card className="bg-urbana-black-soft border-urbana-gold/20 p-8">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-urbana-gold/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-urbana-gold" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-urbana-light/60 text-base mb-1">Tempo estimado</p>
                <p className="text-4xl font-bold text-urbana-light">
                  {estimatedWaitTime === 0 ? 'Agora' : `${estimatedWaitTime} min`}
                </p>
              </div>
            </div>
          </Card>

          {/* Service Info Card */}
          <Card className="bg-urbana-black-soft border-urbana-gold/20 p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Scissors className="w-8 h-8 text-urbana-gold" />
                <div>
                  <p className="text-urbana-light/60 text-sm">Serviço</p>
                  <p className="text-2xl font-bold text-urbana-gold">
                    {appointment.servico?.nome}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <User className="w-8 h-8 text-urbana-gold" />
                <div>
                  <p className="text-urbana-light/60 text-sm">Barbeiro</p>
                  <p className="text-2xl font-bold text-urbana-light">
                    {appointment.barbeiro?.nome}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-6">
          {/* Barber Gallery */}
          {barberGallery.length > 0 && (
            <Card className="bg-urbana-black-soft border-urbana-gold/20 p-8">
              <h3 className="text-2xl font-bold text-urbana-light mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-urbana-gold" />
                Trabalhos Recentes
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
          <Card className="bg-gradient-to-br from-urbana-brown/20 to-urbana-brown-light/10 border-urbana-gold/20 p-8">
            <h3 className="text-2xl font-bold text-urbana-light mb-4">
              Dicas de Cuidados
            </h3>
            <ul className="space-y-3 text-urbana-light/70 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-urbana-gold">✓</span>
                <span>Lave o cabelo 1-2 vezes por semana</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-urbana-gold">✓</span>
                <span>Use produtos adequados ao seu tipo de cabelo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-urbana-gold">✓</span>
                <span>Mantenha a barba hidratada diariamente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-urbana-gold">✓</span>
                <span>Agende seu próximo corte a cada 3-4 semanas</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 text-center">
        <p className="text-urbana-light/40 text-lg">
          Você será notificado quando for sua vez
        </p>
      </div>
    </div>
  );
};

export default TotemWaiting;
