
import React, { useState, useEffect } from 'react';
import { format, addDays, isAfter, isBefore, startOfDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';

interface ClientDateTimePickerProps {
  form: UseFormReturn<any>;
  barberId?: string;
  serviceDuration?: number;
}

const ClientDateTimePicker: React.FC<ClientDateTimePickerProps> = ({ 
  form, 
  barberId = '',
  serviceDuration = 60 
}) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { getAvailableTimeSlots } = useAppointmentValidation();
  
  const selectedDate = form.watch('date');

  // Carregar horários disponíveis quando a data mudar
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDate || !barberId) {
        setAvailableTimeSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slots = await getAvailableTimeSlots(
          barberId,
          selectedDate,
          serviceDuration
        );

        // Filtrar apenas horários disponíveis
        const available = slots
          .filter(slot => slot.available)
          .map(slot => slot.time);

        setAvailableTimeSlots(available);
        
        // Se o horário selecionado não está mais disponível, limpar
        const currentTime = form.getValues('time');
        if (currentTime && !available.includes(currentTime)) {
          form.setValue('time', '');
        }
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedDate, barberId, serviceDuration, getAvailableTimeSlots, form]);

  // Função para determinar data mínima disponível
  const getMinimumDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Se já passou das 19h30 (considerando 30 min de margem), 
    // o próximo dia disponível é amanhã
    if (currentHour >= 19 && currentMinute >= 30) {
      return addDays(startOfDay(now), 1);
    }
    
    // Caso contrário, pode agendar ainda hoje
    return startOfDay(now);
  };

  // Função para verificar se uma data deve ser desabilitada
  const isDateDisabled = (date: Date) => {
    const today = getMinimumDate();
    const maxDate = addDays(today, 30); // Limite de 30 dias
    
    // Desabilitar domingos (0 = domingo)
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    
    // Desabilitar datas anteriores ao mínimo permitido
    const isPastDate = isBefore(date, today);
    
    // Desabilitar datas muito distantes
    const isTooFarAhead = isAfter(date, maxDate);
    
    return isPastDate || isSunday || isTooFarAhead;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-black">Data</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal text-black",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    // Limpar horário selecionado quando mudar a data
                    form.setValue('time', '');
                  }}
                  disabled={isDateDisabled}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  fromDate={getMinimumDate()}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
            <p className="text-xs text-gray-600">
              * Funcionamos de segunda a sábado
            </p>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Horário</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedDate || isLoadingSlots}
            >
              <FormControl>
                <SelectTrigger className="w-full bg-white text-black border-gray-300">
                  {isLoadingSlots ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder={
                      !selectedDate 
                        ? "Selecione uma data primeiro" 
                        : availableTimeSlots.length === 0 
                        ? "Sem horários disponíveis" 
                        : "Selecione o horário"
                    } />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableTimeSlots.length === 0 && !isLoadingSlots ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    Nenhum horário disponível
                  </div>
                ) : (
                  availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClientDateTimePicker;
