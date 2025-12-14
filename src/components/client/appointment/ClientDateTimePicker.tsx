import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, isAfter, isBefore, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ClientDateTimePickerProps {
  form: UseFormReturn<any>;
  barberId?: string;
  serviceDuration?: number;
  appointmentId?: string;
}

const ClientDateTimePicker: React.FC<ClientDateTimePickerProps> = ({ 
  form, 
  barberId = '',
  serviceDuration = 60,
  appointmentId
}) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');

  // Buscar horários disponíveis do barbeiro
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate || !barberId) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    console.log('🕐 [Cliente] Buscando horários disponíveis:', {
      barbeiro: barberId,
      data: format(selectedDate, 'yyyy-MM-dd'),
      duracao: serviceDuration
    });

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isCurrentDay = isToday(selectedDate);
      
      // Configurar slots de 08:30 às 20:00
      const allSlots: TimeSlot[] = [];
      const FIRST_SLOT_HOUR = 8;
      const FIRST_SLOT_MINUTE = 30;
      const CLOSING_HOUR = 20;
      const CLOSING_MINUTE = 0;
      
      const closingTotalMinutes = CLOSING_HOUR * 60 + CLOSING_MINUTE;
      const lastSlotTotalMinutes = closingTotalMinutes - serviceDuration;
      
      for (let hour = FIRST_SLOT_HOUR; hour < CLOSING_HOUR; hour++) {
        for (let minute of [0, 30]) {
          if (hour === FIRST_SLOT_HOUR && minute < FIRST_SLOT_MINUTE) {
            continue;
          }
          
          const slotTotalMinutes = hour * 60 + minute;
          
          if (slotTotalMinutes > lastSlotTotalMinutes) {
            continue;
          }
          
          // Se for hoje, só incluir horários futuros (30 min à frente)
          if (isCurrentDay) {
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            if (slotTotalMinutes <= currentTotalMinutes + 30) {
              continue;
            }
          }
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push({ time: timeString, available: false });
        }
      }

      // Buscar painel_barbeiros id a partir do staff_id
      const { data: barbeiroData, error: barbeiroError } = await supabase
        .from('painel_barbeiros')
        .select('id')
        .eq('staff_id', barberId)
        .maybeSingle();

      if (barbeiroError) {
        console.error('❌ Erro ao buscar barbeiro:', barbeiroError);
      }

      const painelBarbeiroId = barbeiroData?.id || barberId;
      
      console.log('🔍 [Cliente] Usando barbeiro ID:', painelBarbeiroId, 'para verificar slots');

      // Verificar disponibilidade de cada horário usando a função RPC
      const slotsWithAvailability = await Promise.all(
        allSlots.map(async (slot) => {
          const { data, error } = await supabase
            .rpc('check_barber_slot_availability', {
              p_barbeiro_id: painelBarbeiroId,
              p_date: formattedDate,
              p_time: slot.time,
              p_duration: serviceDuration,
              p_exclude_appointment_id: appointmentId || null
            });

          if (error) {
            console.error('❌ Erro ao verificar slot:', slot.time, error);
            return { ...slot, available: false };
          }

          return { ...slot, available: data === true };
        })
      );

      const availableCount = slotsWithAvailability.filter(s => s.available).length;
      console.log('✅ [Cliente] Slots disponíveis:', availableCount);

      setAvailableSlots(slotsWithAvailability);
      
      // Se o horário atual não está disponível, limpar seleção
      const currentTime = form.getValues('time');
      if (currentTime && !slotsWithAvailability.find(s => s.time === currentTime && s.available)) {
        form.setValue('time', '');
      }
    } catch (error) {
      console.error('❌ [Cliente] Erro ao buscar horários:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDate, barberId, serviceDuration, appointmentId, form]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Função para determinar data mínima disponível
  const getMinimumDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour >= 19 && currentMinute >= 30) {
      return addDays(startOfDay(now), 1);
    }
    
    return startOfDay(now);
  };

  // Função para verificar se uma data deve ser desabilitada
  const isDateDisabled = (date: Date) => {
    const today = getMinimumDate();
    const maxDate = addDays(today, 30);
    
    const isPastDate = isBefore(date, today);
    const isTooFarAhead = isAfter(date, maxDate);
    
    return isPastDate || isTooFarAhead;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('date', date);
      form.setValue('time', ''); // Limpar horário ao mudar data
      setCalendarOpen(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    form.setValue('time', time);
  };

  const availableSlotsFiltered = availableSlots.filter(s => s.available);

  return (
    <div className="space-y-4">
      {/* Seleção de Data */}
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Data
            </FormLabel>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    disabled={!barberId}
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal bg-background border-input",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>{barberId ? "Selecione a data" : "Selecione um barbeiro primeiro"}</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  initialFocus
                  locale={ptBR}
                  fromDate={getMinimumDate()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Seleção de Horário */}
      <FormField
        control={form.control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Horário Disponível
              {isLoadingSlots && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </FormLabel>
            
            {!barberId ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Selecione um barbeiro para ver os horários
                </span>
              </div>
            ) : !selectedDate ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Selecione uma data para ver os horários disponíveis
                </span>
              </div>
            ) : isLoadingSlots ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableSlotsFiltered.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Nenhum horário disponível para esta data. Tente outra data.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableSlotsFiltered.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleTimeSelect(slot.time)}
                    className={cn(
                      "h-10 px-2 text-sm rounded-lg font-medium transition-all duration-200",
                      selectedTime === slot.time 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" 
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-primary/50"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
            
            {selectedTime && (
              <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Horário selecionado: <span className="font-semibold">{selectedTime}</span>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClientDateTimePicker;
