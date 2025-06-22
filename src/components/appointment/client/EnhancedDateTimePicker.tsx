
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EnhancedDateTimePickerProps {
  form?: UseFormReturn<any>;
  selectedServiceId?: string;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

const EnhancedDateTimePicker: React.FC<EnhancedDateTimePickerProps> = ({
  form,
  selectedServiceId,
  showAdvanced,
  onToggleAdvanced
}) => {
  if (form) {
    return (
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data do Agendamento</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: ptBR })
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
                  disabled={(date) =>
                    date < new Date() || date.getDay() === 0
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Simple version without form
  return (
    <div className="space-y-2">
      <label className="text-white">Data do Agendamento</label>
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal text-muted-foreground"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Selecione a data
      </Button>
    </div>
  );
};

export default EnhancedDateTimePicker;
