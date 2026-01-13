import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parse, addMinutes, isAfter, isBefore, isEqual, setHours, setMinutes } from 'date-fns';

interface AvailableTimeSlotsProps {
  barberId: string;
  selectedDate: Date;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
  serviceDuration?: number;
}

interface TimeSlot {
  horario: string;
  disponivel: boolean;
}

export const AvailableTimeSlots: React.FC<AvailableTimeSlotsProps> = ({
  barberId,
  selectedDate,
  onSelectTime,
  selectedTime,
  serviceDuration = 30
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (barberId && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [barberId, selectedDate, serviceDuration]);

  const fetchAvailableTimeSlots = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();

      // Fetch working hours for this barber
      const { data: workingHoursData, error: whError } = await supabase
        .from('working_hours')
        .select('start_time, end_time, is_active')
        .eq('staff_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (whError || !workingHoursData) {
        setTimeSlots([]);
        return;
      }

      // Fetch existing appointments for this date
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select('hora, painel_servicos(duracao)')
        .eq('barbeiro_id', barberId)
        .eq('data', dateStr)
        .neq('status', 'cancelado');

      // Generate time slots
      const slots: TimeSlot[] = [];
      const startTime = parse(workingHoursData.start_time, 'HH:mm:ss', selectedDate);
      const endTime = parse(workingHoursData.end_time, 'HH:mm:ss', selectedDate);
      
      let currentSlot = startTime;
      const now = new Date();
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

      while (isBefore(currentSlot, endTime)) {
        const slotStr = format(currentSlot, 'HH:mm');
        const slotEnd = addMinutes(currentSlot, serviceDuration);
        
        // Check if slot is in the past (for today)
        let isAvailable = true;
        if (isToday && isBefore(currentSlot, now)) {
          isAvailable = false;
        }

        // Check if slot conflicts with existing appointments
        if (isAvailable && appointments) {
          for (const apt of appointments) {
            const aptStart = parse(apt.hora, 'HH:mm:ss', selectedDate);
            const aptDuration = (apt.painel_servicos as any)?.duracao || 30;
            const aptEnd = addMinutes(aptStart, aptDuration);
            
            // Check for overlap
            if (
              (isAfter(currentSlot, aptStart) || isEqual(currentSlot, aptStart)) && isBefore(currentSlot, aptEnd) ||
              (isAfter(slotEnd, aptStart) && (isBefore(slotEnd, aptEnd) || isEqual(slotEnd, aptEnd))) ||
              (isBefore(currentSlot, aptStart) && isAfter(slotEnd, aptEnd))
            ) {
              isAvailable = false;
              break;
            }
          }
        }

        slots.push({
          horario: slotStr + ':00',
          disponivel: isAvailable
        });
        
        currentSlot = addMinutes(currentSlot, 30);
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao buscar horários');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
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
