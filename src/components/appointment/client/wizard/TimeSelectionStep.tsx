
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
}

interface TimeSelectionStepProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  selectedBarber?: Barber;
  selectedService?: Service;
}

const TimeSelectionStep: React.FC<TimeSelectionStepProps> = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  selectedBarber,
  selectedService
}) => {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [disabledDays, setDisabledDays] = useState<Date[]>([]);
  const { toast } = useToast();

  // Carregar dias indisponíveis
  useEffect(() => {
    const loadDisabledDays = async () => {
      if (!selectedBarber) return;

      try {
        const { data: timeOffData } = await supabase
          .from('time_off')
          .select('start_date, end_date')
          .eq('staff_id', selectedBarber.id);

        const disabled: Date[] = [];
        timeOffData?.forEach(timeOff => {
          const start = new Date(timeOff.start_date);
          const end = new Date(timeOff.end_date);
          
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            disabled.push(new Date(date));
          }
        });

        setDisabledDays(disabled);
      } catch (error) {
        console.error('Erro ao carregar dias indisponíveis:', error);
      }
    };

    loadDisabledDays();
  }, [selectedBarber]);

  // Carregar horários disponíveis quando data for selecionada
  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const loadAvailableTimes = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setLoading(true);
    try {
      const dayOfWeek = selectedDate.getDay();
      
      // Buscar horário de trabalho do barbeiro
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', selectedBarber.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (!workingHours) {
        setAvailableTimes([]);
        return;
      }

      // Gerar slots de tempo
      const slots = generateTimeSlots(
        workingHours.start_time,
        workingHours.end_time,
        selectedService.duration
      );

      // Verificar quais slots estão disponíveis
      const availableSlots = await checkSlotsAvailability(slots);
      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string, serviceDuration: number) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const interval = 30; // 30 minutos

    for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + interval)) {
      const slotEnd = new Date(time);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
      
      if (slotEnd <= end) {
        slots.push(format(time, 'HH:mm'));
      }
    }

    return slots;
  };

  const checkSlotsAvailability = async (slots: string[]) => {
    if (!selectedDate || !selectedBarber) return [];

    const dateStr = selectedDate.toISOString().split('T')[0];
    const available = [];

    for (const slot of slots) {
      const slotStart = new Date(`${dateStr}T${slot}:00`);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + (selectedService?.duration || 30));

      // Verificar conflitos com agendamentos existentes
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('staff_id', selectedBarber.id)
        .gte('start_time', dateStr)
        .lt('start_time', `${dateStr}T23:59:59`)
        .in('status', ['scheduled', 'confirmed']);

      const hasConflict = conflicts?.some(appointment => {
        const appStart = new Date(appointment.start_time);
        const appEnd = new Date(appointment.end_time);
        return slotStart < appEnd && slotEnd > appStart;
      });

      if (!hasConflict) {
        available.push(slot);
      }
    }

    return available;
  };

  const isDateDisabled = (date: Date) => {
    // Não permitir datas passadas
    if (isBefore(date, new Date().setHours(0, 0, 0, 0))) return true;
    
    // Não permitir datas muito distantes (90 dias)
    if (isAfter(date, addDays(new Date(), 90))) return true;
    
    // Verificar se é um dia de folga
    return disabledDays.some(disabledDay => isSameDay(date, disabledDay));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CalendarIcon className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Escolha data e horário
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendário */}
        <div className="space-y-4">
          <h4 className="font-medium text-white">Selecione a data</h4>
          <div className="bg-gray-800 p-4 rounded-lg">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              locale={ptBR}
              weekStartsOn={1}
              className="rounded-md"
              disabled={isDateDisabled}
              modifiersStyles={{
                disabled: { opacity: 0.5 }
              }}
            />
          </div>
        </div>

        {/* Horários */}
        <div className="space-y-4">
          <h4 className="font-medium text-white">
            Horários disponíveis
            {selectedDate && (
              <span className="text-sm text-gray-400 block">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            )}
          </h4>

          <div className="bg-gray-800 p-4 rounded-lg min-h-[300px]">
            {!selectedDate ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione uma data primeiro</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Carregando horários...</p>
                </div>
              </div>
            ) : availableTimes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`
                      ${selectedTime === time 
                        ? 'bg-amber-500 text-black hover:bg-amber-600' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }
                    `}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum horário disponível</p>
                  <p className="text-sm">Tente outra data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Agendamento selecionado:</span>
          </div>
          <p className="text-white mt-1">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSelectionStep;
