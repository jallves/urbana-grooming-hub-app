import React, { useState } from 'react';
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

  if (!appointment || !client) {
    navigate('/totem/search');
    return null;
  }

  const handleConfirmCheckIn = async () => {
    setIsProcessing(true);
    
    try {
      // Chamar edge function de check-in
      const { data, error } = await supabase.functions.invoke('totem-checkin', {
        body: {
          agendamento_id: appointment.id,
          modo: 'MANUAL'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Check-in realizado com sucesso!');
        navigate('/totem/checkin-success', { 
          state: { 
            appointment: data.agendamento,
            client
          } 
        });
      } else {
        throw new Error(data.error || 'Erro ao fazer check-in');
      }
    } catch (error: any) {
      console.error('Erro no check-in:', error);
      toast.error(error.message || 'Erro ao realizar check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-urbana-black flex flex-col p-8 font-poppins relative overflow-hidden">
      <OfflineIndicator />
      
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12 z-10">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="ghost"
          size="lg"
          className="h-16 px-8 text-xl text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
        >
          <ArrowLeft className="w-7 h-7 mr-3" />
          Voltar
        </Button>
        <h1 className="text-5xl font-bold text-urbana-light text-center flex-1">
          Confirme seus dados
        </h1>
        <div className="w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="w-full max-w-5xl p-12 space-y-10 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* Client Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-6 pb-8 border-b-2 border-urbana-gold/20">
              <div className="w-16 h-16 rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <User className="w-10 h-10 text-urbana-gold" />
              </div>
              <div>
                <p className="text-2xl text-urbana-light/60">Cliente</p>
                <p className="text-5xl font-bold text-urbana-light">{client.nome}</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-10">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-2">
                  <Calendar className="w-8 h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-2xl text-urbana-light/60 mb-2">Data</p>
                  <p className="text-4xl font-bold text-urbana-light">
                    {format(new Date(appointment.data), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-2">
                  <Clock className="w-8 h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-2xl text-urbana-light/60 mb-2">Horário</p>
                  <p className="text-4xl font-bold text-urbana-light">{appointment.hora}</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-2">
                  <Scissors className="w-8 h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-2xl text-urbana-light/60 mb-2">Serviço</p>
                  <p className="text-4xl font-bold text-urbana-light">{appointment.servico?.nome}</p>
                  <p className="text-3xl text-urbana-gold font-semibold mt-2">
                    R$ {appointment.servico?.preco?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-urbana-gold/10 flex items-center justify-center mt-2">
                  <User className="w-8 h-8 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-2xl text-urbana-light/60 mb-2">Barbeiro</p>
                  <p className="text-4xl font-bold text-urbana-light">{appointment.barbeiro?.nome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-10">
            <Button
              onClick={handleConfirmCheckIn}
              disabled={isProcessing}
              className="w-full h-28 text-4xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black hover:from-urbana-gold-dark hover:to-urbana-gold disabled:opacity-50 shadow-2xl shadow-urbana-gold/30 hover:shadow-urbana-gold/50 transition-all"
            >
              {isProcessing ? (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                  PROCESSANDO...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 mr-4" />
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
