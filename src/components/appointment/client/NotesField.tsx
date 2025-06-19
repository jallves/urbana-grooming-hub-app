
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { MessageSquare } from 'lucide-react';

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
          <FormLabel className="text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Observações (Opcional)
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Alguma observação especial ou preferência..."
              className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400 resize-none"
              rows={4}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default NotesField;
