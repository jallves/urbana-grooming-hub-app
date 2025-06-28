
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

interface Barber {
  id: string;
  name: string;
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setLoading(true);
    const slots: string[] = [];

    try {
      // Gerar slots de 30 em 30 minutos das 9h às 20h
      for (let hour = 9; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se há conflito
          const [hours, minutes] = timeString.split(':').map(Number);
          const startTime = new Date(selectedDate);
          startTime.setHours(hours, minutes, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

          // Verificar conflitos com agendamentos existentes
          const { data: conflicts, error } = await supabase
            .from('appointments')
            .select('id, start_time, end_time')
            .eq('staff_id', selectedBarber.id)
            .in('status', ['scheduled', 'confirmed'])
            .gte('start_time', selectedDate.toISOString().split('T')[0])
            .lt('start_time', new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

          if (error) {
            console.error('Erro verificando conflitos:', error);
            continue;
          }

          const hasConflict = conflicts?.some(appointment => {
            const appStart = new Date(appointment.start_time);
            const appEnd = new Date(appointment.end_time);
            return startTime < appEnd && endTime > appStart;
          }) || false;

          if (!hasConflict) {
            slots.push(timeString);
          }
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Escolha data e horário
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendário */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-4 w-4 text-amber-500" />
            <h4 className="font-medium text-white">Selecione a data</h4>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              disabled={(date) => date < new Date() || date.getDay() === 0}
              locale={ptBR}
              weekStartsOn={1}
              fromDate={new Date()}
              toDate={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)}
              className="rounded-md border-gray-600"
            />
          </div>
        </div>

        {/* Horários */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-500" />
            <h4 className="font-medium text-white">Selecione o horário</h4>
          </div>

          {selectedDate ? (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-4">
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      onClick={() => onTimeSelect(slot)}
                      variant={selectedTime === slot ? "default" : "outline"}
                      className={`
                        text-sm py-2 px-3
                        ${selectedTime === slot 
                          ? 'bg-amber-500 text-black hover:bg-amber-600' 
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Nenhum horário disponível nesta data.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <CalendarIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Selecione uma data primeiro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionStep;
