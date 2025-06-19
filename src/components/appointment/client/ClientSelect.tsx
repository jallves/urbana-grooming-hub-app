
import React from 'react';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { User } from 'lucide-react';

interface ClientSelectProps {
  form: UseFormReturn<any>;
  clientName: string;
}

const ClientSelect: React.FC<ClientSelectProps> = ({ form, clientName }) => {
  return (
    <FormField
      control={form.control}
      name="client_name"
      render={() => (
        <FormItem>
          <FormLabel className="text-white flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
          </FormLabel>
          <div className="p-4 bg-stone-700 border border-stone-600 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <User className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-white font-medium">{clientName}</p>
                <p className="text-stone-400 text-sm">Cliente autenticado</p>
              </div>
            </div>
          </div>
        </FormItem>
      )}
    />
  );
};

export default ClientSelect;
