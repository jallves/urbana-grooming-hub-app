
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
          <FormLabel>Observações <span className="text-sm text-stone-400">(Opcional)</span></FormLabel>
          <FormControl>
            <Textarea
              placeholder="Alguma preferência especial ou observação..."
              className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400 resize-none"
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
