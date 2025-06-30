
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface NotesFieldProps {
  form: UseFormReturn<any>;
}

const NotesField: React.FC<NotesFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">Observações</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Informações adicionais sobre o agendamento"
              className="resize-none text-black"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default NotesField;
