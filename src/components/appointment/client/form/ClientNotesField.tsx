
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface ClientNotesFieldProps {
  form: UseFormReturn<any>;
}

const ClientNotesField: React.FC<ClientNotesFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Observações</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Informações adicionais sobre o agendamento"
              className="resize-none bg-stone-700 border-stone-600 text-white placeholder:text-gray-400"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ClientNotesField;
