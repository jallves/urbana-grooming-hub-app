
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors } from 'lucide-react';
import { Service } from '@/types/appointment';
import { Control } from 'react-hook-form';
import { ClientAppointmentFormData } from '../hooks/useClientAppointmentForm';

interface ServiceSelectionFieldProps {
  control: Control<ClientAppointmentFormData>;
  services: Service[];
}

export function ServiceSelectionField({ control, services }: ServiceSelectionFieldProps) {
  return (
    <FormField
      control={control}
      name="serviceId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serviço</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="relative flex items-center">
                <Scissors className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
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
}
