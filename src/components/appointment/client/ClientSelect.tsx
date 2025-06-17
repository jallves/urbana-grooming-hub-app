
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface ClientSelectProps {
  form: UseFormReturn<any>;
  clientName: string;
}

const ClientSelect: React.FC<ClientSelectProps> = ({ form, clientName }) => {
  return (
    <FormField
      control={form.control}
      name="client_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={clientName}
              disabled
              className="bg-stone-700 border-stone-600 text-white"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ClientSelect;
