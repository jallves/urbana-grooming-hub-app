
import React from 'react';
import { Service } from '@/types/appointment';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface ClientServiceSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
}

const ClientServiceSelect: React.FC<ClientServiceSelectProps> = ({ services, form }) => {
  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Serviço</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600">
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id} className="text-white hover:bg-stone-700">
                  {service.name} - R$ {service.price} ({service.duration} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ClientServiceSelect;
