
import React from 'react';
import { Service } from '@/types/appointment';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface ServiceSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
}

const ServiceSelect: React.FC<ServiceSelectProps> = ({ services, form }) => {
  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">Serviço</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger className="text-black">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id || "no-id"} className="text-black">
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

export default ServiceSelect;
