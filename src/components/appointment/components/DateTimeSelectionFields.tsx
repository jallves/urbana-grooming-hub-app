
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Control } from 'react-hook-form';
import { ClientAppointmentFormData } from '../hooks/useClientAppointmentForm';
import { Service } from '@/types/appointment';

interface DateTimeSelectionFieldsProps {
  control: Control<ClientAppointmentFormData>;
  selectedService: Service | null;
  availableTimes: string[];
  disabledDays: (date: Date) => boolean;
  getFieldValue: (field: keyof ClientAppointmentFormData) => any;
  fetchAvailableTimes: (date: Date, serviceId: string, staffId: string) => Promise<void>;
}

export function DateTimeSelectionFields({ 
  control, 
  selectedService, 
  availableTimes, 
  disabledDays,
  getFieldValue,
  fetchAvailableTimes
}: DateTimeSelectionFieldsProps) {
  
  // Watch for date changes to refresh available times
  useEffect(() => {
    const date = getFieldValue('date');
    const serviceId = getFieldValue('serviceId');
    
    if (date && serviceId) {
      fetchAvailableTimes(date, serviceId, '');
    }
  }, [getFieldValue('date'), getFieldValue('serviceId'), fetchAvailableTimes]);

  return (
    <>
      {/* Date Selection */}
      <FormField
        control={control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal flex items-center",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={!selectedService}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={disabledDays}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
            {!selectedService && (
              <p className="text-sm text-muted-foreground">
                Selecione um serviço primeiro
              </p>
            )}
          </FormItem>
        )}
      />

      {/* Time Selection */}
      <FormField
        control={control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""} 
              disabled={!getFieldValue('date') || !availableTimes.length}
            >
              <FormControl>
                <SelectTrigger className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    {!getFieldValue('date') ? 'Selecione uma data primeiro' : 'Nenhum horário disponível'}
                  </div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
            {getFieldValue('date') && availableTimes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Carregando horários disponíveis...
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
}
