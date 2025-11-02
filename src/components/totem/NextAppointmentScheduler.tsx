import React, { useState } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NextAppointmentSchedulerProps {
  clientId: string;
  barberId: string;
  serviceId: string;
  lastAppointmentTime?: string;
  onScheduled?: () => void;
  className?: string;
}

/**
 * Componente para agendar próximo corte após checkout
 * Fase 3: Fidelização e recorrência
 */
export const NextAppointmentScheduler: React.FC<NextAppointmentSchedulerProps> = ({
  clientId,
  barberId,
  serviceId,
  lastAppointmentTime,
  onScheduled,
  className,
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  // Sugerir datas (3 ou 4 semanas a partir de hoje)
  const suggestedDates = [
    addWeeks(new Date(), 3),
    addWeeks(new Date(), 4),
    addDays(addWeeks(new Date(), 4), 7),
  ];

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast({
        title: "Selecione uma data",
        description: "Escolha uma das datas sugeridas",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);

    try {
      // Usar o horário do último agendamento ou padrão
      const timeToUse = lastAppointmentTime || '09:00';
      
      const { error } = await supabase.from('painel_agendamentos').insert({
        cliente_id: clientId,
        barbeiro_id: barberId,
        servico_id: serviceId,
        data: format(selectedDate, 'yyyy-MM-dd'),
        hora: timeToUse,
        status: 'agendado',
        observacoes: 'Agendamento via Totem - Retorno programado',
      });

      if (error) throw error;

      setScheduled(true);
      
      toast({
        title: "Agendamento confirmado!",
        description: `Seu próximo corte está marcado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`,
      });

      if (onScheduled) {
        setTimeout(() => onScheduled(), 1500);
      }
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente ou fale com um atendente",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  if (scheduled) {
    return (
      <Card className={cn('bg-green-500/20 border-2 border-green-500/40 p-3 sm:p-4 md:p-6', className)}>
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-green-500/30">
            <Check className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-400" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light mb-1 sm:mb-2">
              Próximo corte agendado!
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-urbana-light/70">
              {format(selectedDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-urbana-black-soft border-urbana-gold/20 p-3 sm:p-4 md:p-6', className)}>
      <div className="mb-3 sm:mb-4 md:mb-6">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
          Agende seu próximo corte
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">
          Garanta seu horário e mantenha seu visual sempre em dia
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 md:mb-6">
        <p className="text-xs sm:text-sm md:text-base text-urbana-light/70 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
          Horário sugerido: {lastAppointmentTime || '09:00'}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {suggestedDates.map((date, index) => {
            const isSelected = selectedDate?.getTime() === date.getTime();
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all duration-200',
                  'active:scale-95',
                  isSelected
                    ? 'bg-urbana-gold/20 border-urbana-gold shadow-lg'
                    : 'bg-urbana-black border-urbana-gold/20 active:border-urbana-gold/40'
                )}
              >
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 mb-0.5 sm:mb-1">
                    {format(date, 'EEEE', { locale: ptBR })}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light mb-0.5 sm:mb-1">
                    {format(date, 'dd')}
                  </p>
                  <p className="text-xs sm:text-sm text-urbana-gold">
                    {format(date, 'MMM', { locale: ptBR })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleSchedule}
        disabled={!selectedDate || isScheduling}
        className="w-full text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 bg-urbana-gold text-urbana-black hover:bg-urbana-gold-light"
      >
        {isScheduling ? (
          <>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse" />
            Confirmando...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Confirmar Agendamento
          </>
        )}
      </Button>

      <p className="text-center text-xs sm:text-sm text-urbana-light/40 mt-2 sm:mt-3 md:mt-4">
        Você pode reagendar ou cancelar quando quiser
      </p>
    </Card>
  );
};
