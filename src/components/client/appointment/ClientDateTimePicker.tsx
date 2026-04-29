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
      duracao: serviceDuration,
      excluindoAgendamento: appointmentId || null,
    });

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Buscar agendamentos existentes do barbeiro nesse dia (em painel_barbeiros.id),
      // excluindo cancelados e o próprio agendamento (no caso de edição).
      let appointmentsQuery = supabase
        .from('painel_agendamentos')
        .select('id, hora, servicos_extras, painel_servicos!inner(duracao)')
        .eq('barbeiro_id', barberId)
        .eq('data', formattedDate)
        .neq('status', 'cancelado');

      if (appointmentId) {
        appointmentsQuery = appointmentsQuery.neq('id', appointmentId);
      }

      const { data: existingAppointments, error: apptErr } = await appointmentsQuery;
      if (apptErr) {
        console.error('❌ [Cliente] Erro ao buscar agendamentos do dia:', apptErr);
      }

      // Buscar bloqueios de disponibilidade (folgas / fechamento de loja)
      // tentando localizar barber_availability tanto pelo painel_barbeiros.id
      // quanto pelo staff_id mapeado (compatível com fluxos existentes).
      let staffIdMirror: string | null = null;
      const { data: barbeiroData } = await supabase
        .from('painel_barbeiros')
        .select('staff_id')
        .eq('id', barberId)
        .maybeSingle();
      if (barbeiroData?.staff_id) staffIdMirror = barbeiroData.staff_id;

      const idsForAvailability = [barberId, staffIdMirror].filter(Boolean) as string[];
      const { data: blocks } = await supabase
        .from('barber_availability')
        .select('start_time, end_time, is_available')
        .in('barber_id', idsForAvailability)
        .eq('date', formattedDate)
        .eq('is_available', false);

      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      // Hoje? Para evitar horários passados
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const isTodaySelected = formattedDate === todayStr;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // Gerar slots de 30 em 30 entre 09:00 e 20:00
      const slots: TimeSlot[] = [];
      const startMinutes = 9 * 60;
      const endMinutes = 20 * 60;

      for (let mins = startMinutes; mins + serviceDuration <= endMinutes; mins += 30) {
        const hh = Math.floor(mins / 60);
        const mm = mins % 60;
        const time = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
        const slotEnd = mins + serviceDuration;

        let available = true;

        // Bloqueia horários passados (com 15 min de antecedência mínima)
        if (isTodaySelected && mins <= nowMinutes + 15) {
          available = false;
        }

        // Verifica conflito com agendamentos existentes (sobreposição de duração)
        if (available && existingAppointments) {
          for (const appt of existingAppointments as any[]) {
            const apptStart = toMinutes(appt.hora);
            const baseDur = (appt.painel_servicos?.duracao as number) || 60;
            const extras = Array.isArray(appt.servicos_extras)
              ? appt.servicos_extras.reduce(
                  (s: number, e: any) => s + (Number(e?.duracao) || 0),
                  0
                )
              : 0;
            const apptEnd = apptStart + baseDur + extras;
            if (mins < apptEnd && slotEnd > apptStart) {
              available = false;
              break;
            }
          }
        }

        // Verifica bloqueios manuais (folga / fechamento de barbearia)
        if (available && blocks?.length) {
          for (const b of blocks) {
            const bStart = toMinutes(b.start_time as string);
            const bEnd = toMinutes(b.end_time as string);
            if (mins < bEnd && slotEnd > bStart) {
              available = false;
              break;
            }
          }
        }

        slots.push({ time, available });
      }

      const availableCount = slots.filter(s => s.available).length;
      console.log('✅ [Cliente] Slots disponíveis:', availableCount);

      setAvailableSlots(slots);
      
      // Se o horário atual não está disponível, limpar seleção
      const currentTime = form.getValues('time');
      if (currentTime && !slots.find(s => s.time === currentTime && s.available)) {
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
