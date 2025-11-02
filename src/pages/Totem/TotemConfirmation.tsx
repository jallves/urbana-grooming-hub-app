import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, User, Scissors, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfflineIndicator } from '@/components/totem/OfflineIndicator';

const TotemConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);

  // Add totem-mode class for touch optimization
  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  if (!appointment || !client) {
    navigate('/totem/search');
    return null;
  }

  const handleConfirmCheckIn = async () => {
    try {
      setIsProcessing(true);
      
      console.log('🔄 Iniciando check-in para agendamento:', appointment?.id);

      const { data, error } = await supabase.functions.invoke('totem-checkin', {
        body: {
          agendamento_id: appointment.id,
          modo: 'MANUAL'
        }
      });

      if (error) {
        console.error('❌ Erro no check-in:', error);
        
        // Tratamento específico de erros
        if (error.message?.includes('já foi realizado')) {
          toast.error('Check-in já realizado', {
            description: 'Este agendamento já teve check-in feito anteriormente.'
          });
        } else if (error.message?.includes('não encontrado')) {
          toast.error('Agendamento não encontrado', {
            description: 'Não foi possível localizar este agendamento. Procure a recepção.'
          });
        } else if (error.message?.includes('cancelado')) {
          toast.error('Agendamento cancelado', {
            description: 'Este agendamento foi cancelado. Procure a recepção para reagendar.'
          });
        } else {
          toast.error('Erro no check-in', {
            description: error.message || 'Não foi possível fazer o check-in. Procure a recepção.'
          });
        }
        throw error;
      }

      if (!data?.success) {
        console.error('❌ Falha no check-in:', data?.error);
        toast.error('Erro no check-in', {
          description: data?.error || 'Não foi possível fazer o check-in.'
        });
        throw new Error(data?.error || 'Erro ao fazer check-in');
      }

      console.log('✅ Check-in realizado com sucesso!');
      console.log('📦 Session retornada:', data.session);

      // Navegar para tela de sucesso
      navigate('/totem/check-in-success', {
        state: {
          client,
          appointment,
          session: data.session
        }
      });
    } catch (error: any) {
      console.error('❌ Erro inesperado no check-in:', error);
      // Erro já foi tratado acima
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      <OfflineIndicator />
      
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12 z-10">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1">
          Confirme seus dados
        </h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* Client Info */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-6 md:pb-8 border-b-2 border-urbana-gold/20">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
              </div>
              <div>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/60">Cliente</p>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light">{client.nome}</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-1 sm:mt-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/60 mb-1 sm:mb-2">Data</p>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">
                    {format(new Date(appointment.data), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-1 sm:mt-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/60 mb-1 sm:mb-2">Horário</p>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">{appointment.hora}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-1 sm:mt-2">
                  <Scissors className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/60 mb-1 sm:mb-2">Serviço</p>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">{appointment.servico?.nome}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-urbana-gold font-semibold mt-1 sm:mt-2">
                    R$ {appointment.servico?.preco?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-1 sm:mt-2">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/60 mb-1 sm:mb-2">Barbeiro</p>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">{appointment.barbeiro?.nome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4 sm:pt-6 md:pt-8 lg:pt-10">
            <Button
              onClick={handleConfirmCheckIn}
              disabled={isProcessing}
              className="w-full h-16 sm:h-20 md:h-24 lg:h-28 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold disabled:opacity-50 shadow-2xl shadow-urbana-gold/30 active:shadow-urbana-gold/50 transition-all duration-100 active:scale-98"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-3 sm:border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                  PROCESSANDO...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4" />
                  CONFIRMAR CHECK-IN
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemConfirmation;
