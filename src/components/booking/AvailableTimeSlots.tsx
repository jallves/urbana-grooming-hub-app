import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvailableTimeSlotsProps {
  barberId: string;
  selectedDate: Date;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
}

interface TimeSlot {
  horario: string;
  disponivel: boolean;
}

export const AvailableTimeSlots: React.FC<AvailableTimeSlotsProps> = ({
  barberId,
  selectedDate,
  onSelectTime,
  selectedTime
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (barberId && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [barberId, selectedDate]);

  const fetchAvailableTimeSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_barbeiro_horarios_disponiveis', {
        p_barbeiro_id: barberId,
        p_data: selectedDate.toISOString().split('T')[0],
        p_duracao_minutos: 30
      });

      if (error) {
        console.error('Erro ao buscar horários:', error);
        toast.error('Erro ao buscar horários disponíveis');
        return;
      }

      setTimeSlots(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao buscar horários');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    // Formato esperado: "14:30:00" -> "14:30"
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          Nenhum horário disponível para esta data
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Selecione um horário disponível:</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {timeSlots.map((slot) => {
          const timeStr = formatTime(slot.horario);
          const isSelected = selectedTime === timeStr;
          const isAvailable = slot.disponivel;

          return (
            <Button
              key={timeStr}
              onClick={() => isAvailable && onSelectTime(timeStr)}
              disabled={!isAvailable}
              variant={isSelected ? "default" : "outline"}
              className={`
                relative h-12 
                ${!isAvailable && 'opacity-40 cursor-not-allowed'}
                ${isSelected && 'ring-2 ring-primary'}
              `}
            >
              {isSelected && (
                <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-primary bg-background rounded-full" />
              )}
              <span className="font-semibold">{timeStr}</span>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-primary rounded" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-muted rounded" />
          <span>Ocupado</span>
        </div>
      </div>
    </div>
  );
};
