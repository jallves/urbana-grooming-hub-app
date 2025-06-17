
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
  console.log('[ServiceSelect] Renderizando com serviços:', services);

  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serviço</FormLabel>
          <Select 
            onValueChange={(value) => {
              console.log('[ServiceSelect] Serviço selecionado:', value);
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
              {services.length > 0 ? (
                services.map((service) => (
                  <SelectItem 
                    key={service.id} 
                    value={service.id || ""}
                    className="text-white hover:bg-stone-700"
                  >
                    {service.name} - R$ {service.price?.toFixed(2)} ({service.duration} min)
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-stone-400">
                  Nenhum serviço disponível
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ServiceSelect;
