import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, User, Scissors, Clock, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfflineIndicator } from '@/components/totem/OfflineIndicator';
import barbershopBg from '@/assets/barbershop-background.jpg';

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
      console.log('📦 Session ID retornada:', data.session_id);

      // Navegar para tela de sucesso
      navigate('/totem/check-in-success', {
        state: {
          client,
          appointment,
          session: { 
            id: data.session_id,
            appointment_id: appointment.id,
            status: 'check_in'
          }
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
      <OfflineIndicator />
      
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-urbana-black/60" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="ghost"
          size="lg"
          className="h-12 md:h-14 px-4 md:px-6 text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 active:bg-urbana-gold/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
            Confirme seus dados
          </h1>
          <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
        </div>
        <div className="w-20 md:w-32"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-4">
        <Card className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 bg-white/5 backdrop-blur-2xl border-2 border-urbana-gold/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-scale-in">
          {/* Client Info */}
          <div className="space-y-6 md:space-y-8">
            <div className="relative flex items-center gap-4 md:gap-6 pb-6 md:pb-8 border-b-2 border-urbana-gold/30">
              {/* Glow effect */}
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-urbana-gold/20 rounded-full blur-2xl" />
              
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border-2 border-urbana-gold/40">
                <User className="w-8 h-8 md:w-10 md:h-10 text-urbana-gold" />
              </div>
              <div>
                <p className="text-lg md:text-xl text-urbana-gold/80 font-medium mb-1">Cliente</p>
                <p className="text-3xl md:text-4xl lg:text-5xl font-black text-urbana-light">{client.nome}</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Data Card */}
              <div className="group relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-urbana-gold/30 hover:border-urbana-gold/50 transition-all overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border border-urbana-gold/30">
                    <Calendar className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-lg text-urbana-gold/70 font-medium mb-2">Data</p>
                    <p className="text-2xl md:text-3xl font-bold text-urbana-light">
                      {format(new Date(appointment.data), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Horário Card */}
              <div className="group relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-urbana-gold/30 hover:border-urbana-gold/50 transition-all overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border border-urbana-gold/30">
                    <Clock className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-lg text-urbana-gold/70 font-medium mb-2">Horário</p>
                    <p className="text-2xl md:text-3xl font-bold text-urbana-light">{appointment.hora}</p>
                  </div>
                </div>
              </div>

              {/* Serviço Card */}
              <div className="group relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-urbana-gold/30 hover:border-urbana-gold/50 transition-all overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border border-urbana-gold/30">
                    <Scissors className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-lg text-urbana-gold/70 font-medium mb-2">Serviço</p>
                    <p className="text-2xl md:text-3xl font-bold text-urbana-light mb-2">{appointment.servico?.nome}</p>
                    <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant">
                      R$ {appointment.servico?.preco?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barbeiro Card */}
              <div className="group relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-urbana-gold/30 hover:border-urbana-gold/50 transition-all overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border border-urbana-gold/30">
                    <User className="w-7 h-7 md:w-8 md:h-8 text-urbana-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-lg text-urbana-gold/70 font-medium mb-2">Barbeiro</p>
                    <p className="text-2xl md:text-3xl font-bold text-urbana-light">{appointment.barbeiro?.nome}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-6 md:pt-8">
            <Button
              onClick={handleConfirmCheckIn}
              disabled={isProcessing}
              className="relative w-full h-20 md:h-24 lg:h-28 text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black hover:from-urbana-gold-vibrant hover:via-urbana-gold hover:to-urbana-gold-vibrant disabled:opacity-50 shadow-2xl shadow-urbana-gold/40 transition-all duration-300 overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              <div className="relative flex items-center justify-center gap-3 md:gap-4">
                {isProcessing ? (
                  <>
                    <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                    PROCESSANDO...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-10 h-10 md:w-12 md:h-12" />
                    CONFIRMAR CHECK-IN
                  </>
                )}
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemConfirmation;
