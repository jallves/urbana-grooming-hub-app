
import React from 'react';
import { format, addDays, isAfter, isBefore, startOfDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';

interface ClientDateTimePickerProps {
  form: UseFormReturn<any>;
}

const ClientDateTimePicker: React.FC<ClientDateTimePickerProps> = ({ form }) => {
  // Gerar horários disponíveis com base no horário atual (com margem de 30 min)
  const generateTimeSlots = (selectedDate?: Date) => {
    const slots = [];
    const now = new Date();
    // Adicionar 30 minutos de margem para preparação
    const minTime = addMinutes(now, 30);
    
    const isToday = selectedDate && 
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    // Horário de funcionamento: 08:00 às 20:00
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Se for hoje, só mostrar horários futuros (com 30 min de margem)
        if (isToday) {
          const slotDateTime = new Date(selectedDate);
          slotDateTime.setHours(hour, minute, 0, 0);
          
          if (slotDateTime < minTime) {
            continue;
          }
        }
        
        slots.push(slotTime);
      }
    }
    
    return slots;
  };

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

  const selectedDate = form.watch('date');
  const timeSlots = generateTimeSlots(selectedDate);

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
            <FormLabel className="text-black">Hora</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedDate}
            >
              <FormControl>
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {timeSlots.length > 0 ? (
                  timeSlots.map((time) => (
                    <SelectItem key={time} value={time} className="text-black">
                      {time}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled className="text-gray-500">
                    {selectedDate ? 'Nenhum horário disponível' : 'Selecione uma data primeiro'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
            <p className="text-xs text-gray-600">
              * Atendimento das 08h às 20h (agende com 30 min de antecedência)
            </p>
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClientDateTimePicker;
