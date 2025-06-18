
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { UseFormReturn } from 'react-hook-form';
import { useAdvancedAvailability } from '@/hooks/useAdvancedAvailability';

interface EnhancedDateTimePickerProps {
  form: UseFormReturn<any>;
  selectedServiceId?: string;
  selectedStaffId?: string;
  onDateChange?: (date: Date) => void;
  onTimeChange?: (time: string) => void;
}

const EnhancedDateTimePicker: React.FC<EnhancedDateTimePickerProps> = ({ 
  form, 
  selectedServiceId,
  selectedStaffId,
  onDateChange,
  onTimeChange
}) => {
  const { availableSlots, isLoading, fetchAvailableSlots } = useAdvancedAvailability();
  
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');

  useEffect(() => {
    if (selectedDate && selectedStaffId && selectedServiceId) {
      // Buscar duração do serviço (assumindo 60 min como padrão)
      fetchAvailableSlots(selectedStaffId, selectedDate, 60);
    }
  }, [selectedDate, selectedStaffId, selectedServiceId, fetchAvailableSlots]);

  // Disable past dates and Sundays
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable Sundays (0)
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-white flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Escolha a Data
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal bg-stone-700 border-stone-600 text-white hover:bg-stone-600",
                      !field.value && "text-stone-400"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-stone-800 border-stone-600" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    if (date) onDateChange?.(date);
                  }}
                  disabled={isDateDisabled}
                  initialFocus
                  className="bg-stone-800 text-white"
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
            <FormLabel className="text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários Disponíveis
              {isLoading && (
                <Badge variant="secondary" className="ml-2">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Carregando...
                </Badge>
              )}
            </FormLabel>
            
            {!selectedDate && (
              <div className="p-4 bg-stone-700 border border-stone-600 rounded-lg text-stone-400 text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                <p>Primeiro selecione uma data</p>
              </div>
            )}

            {selectedDate && !selectedStaffId && (
              <div className="p-4 bg-stone-700 border border-stone-600 rounded-lg text-stone-400 text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                <p>Selecione um barbeiro para ver os horários</p>
              </div>
            )}

            {selectedDate && selectedStaffId && (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 bg-stone-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        variant={field.value === slot.time ? "default" : "outline"}
                        className={cn(
                          "h-10 text-sm",
                          field.value === slot.time 
                            ? "bg-amber-500 text-black hover:bg-amber-600" 
                            : "bg-stone-700 border-stone-600 text-white hover:bg-stone-600"
                        )}
                        onClick={() => {
                          field.onChange(slot.time);
                          onTimeChange?.(slot.time);
                        }}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-center">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                    <p>Nenhum horário disponível para esta data</p>
                    <p className="text-sm mt-1">Tente selecionar outro dia</p>
                  </div>
                )}
              </div>
            )}
            
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedDateTimePicker;
