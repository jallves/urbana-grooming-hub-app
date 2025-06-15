
import React from 'react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';
import { FormData } from '../hooks/useClientAppointmentForm';

interface AppointmentNotesFieldProps {
  control: Control<FormData>;
}

export function AppointmentNotesField({ control }: AppointmentNotesFieldProps) {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea 
              placeholder="Informe detalhes adicionais sobre o seu agendamento (opcional)" 
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-urbana-gold focus:ring-urbana-gold/20 resize-none min-h-[100px]" 
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
