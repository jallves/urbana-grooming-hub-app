
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
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

interface DateTimePickerProps {
  form: UseFormReturn<any>;
  barberId?: string;
  serviceDuration?: number;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  form, 
  barberId = '',
  serviceDuration = 60 
}) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { getAvailableTimeSlots } = useAppointmentValidation();
  
  const selectedDate = form.watch('date');

  // Carregar horários disponíveis quando a data ou barbeiro mudar
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
                  onSelect={field.onChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Hora</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedDate || isLoadingSlots}
            >
              <FormControl>
                <SelectTrigger className="text-black">
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
                        : "Selecione um horário"
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
                    <SelectItem key={time} value={time} className="text-black">
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

export default DateTimePicker;
