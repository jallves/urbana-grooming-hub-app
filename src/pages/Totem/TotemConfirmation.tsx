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
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-6 md:p-8">
      <OfflineIndicator />
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="outline"
          size="lg"
          className="h-16 sm:h-18 md:h-20 px-4 sm:px-6 md:px-8 text-xl sm:text-xl md:text-2xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 md:mr-4" />
          Voltar
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-center flex-1">Confirme seus dados</h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-7 md:space-y-8 bg-card">
          {/* Client Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <User className="w-12 h-12 text-urbana-gold" />
              <div>
                <p className="text-2xl text-muted-foreground">Cliente</p>
                <p className="text-4xl font-bold text-foreground">{client.nome}</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Calendar className="w-10 h-10 text-urbana-gold mt-2" />
                <div>
                  <p className="text-2xl text-muted-foreground">Data</p>
                  <p className="text-3xl font-bold text-foreground">
                    {format(new Date(appointment.data), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="w-10 h-10 text-urbana-gold mt-2" />
                <div>
                  <p className="text-2xl text-muted-foreground">Horário</p>
                  <p className="text-3xl font-bold text-foreground">{appointment.hora}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Scissors className="w-10 h-10 text-urbana-gold mt-2" />
                <div>
                  <p className="text-2xl text-muted-foreground">Serviço</p>
                  <p className="text-3xl font-bold text-foreground">{appointment.servico?.nome}</p>
                  <p className="text-2xl text-urbana-gold font-semibold">
                    R$ {appointment.servico?.preco?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="w-10 h-10 text-urbana-gold mt-2" />
                <div>
                  <p className="text-2xl text-muted-foreground">Barbeiro</p>
                  <p className="text-3xl font-bold text-foreground">{appointment.barbeiro?.nome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-8">
            <Button
              onClick={handleConfirmCheckIn}
              disabled={isProcessing}
              className="w-full h-28 text-4xl font-bold bg-urbana-gold text-black hover:bg-urbana-gold/90 disabled:opacity-50"
            >
              <CheckCircle className="w-12 h-12 mr-4" />
              {isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR CHECK-IN'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemConfirmation;
