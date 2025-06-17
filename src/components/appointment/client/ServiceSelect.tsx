
import React from 'react';
import { Service } from '@/types/appointment';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface ServiceSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
  onServiceChange?: (serviceId: string) => void;
}

const ServiceSelect: React.FC<ServiceSelectProps> = ({ services, form, onServiceChange }) => {
  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serviço</FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              onServiceChange?.(value);
            }}
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600">
              {services.map((service) => (
                <SelectItem 
                  key={service.id} 
                  value={service.id || "no-id"}
                  className="text-white hover:bg-stone-700"
                >
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
