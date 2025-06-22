
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface NotesFieldProps {
  form?: UseFormReturn<any>;
}

const NotesField: React.FC<NotesFieldProps> = ({ form }) => {
  if (form) {
    return (
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Observações adicionais sobre o agendamento..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Simple version without form
  return (
    <div className="space-y-2">
      <label className="text-white">Observações</label>
      <Textarea
        placeholder="Observações adicionais sobre o agendamento..."
        className="resize-none"
      />
    </div>
  );
};

export default NotesField;
