
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors } from 'lucide-react';
import { Service } from '@/types/appointment';
import { Control } from 'react-hook-form';
import { FormData } from '../hooks/useClientAppointmentForm';

interface ServiceSelectionFieldProps {
  control: Control<FormData>;
  services: Service[];
  selectedService: Service | null;
  setSelectedService: (service: Service | null) => void;
  setFinalServicePrice: (price: number) => void;
}

export function ServiceSelectionField({ 
  control, 
  services, 
  selectedService,
  setSelectedService,
  setFinalServicePrice
}: ServiceSelectionFieldProps) {
  return (
    <FormField
      control={control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Serviço
          </FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              const selected = services.find(s => s.id === value) || null;
              setSelectedService(selected);
              if (selected) {
                setFinalServicePrice(selected.price);
              }
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
                <SelectItem key={service.id} value={service.id} className="text-white hover:bg-stone-700">
                  <div className="flex items-center justify-between w-full">
                    <span>{service.name}</span>
                    <span className="text-amber-400 ml-4">
                      R$ {service.price.toFixed(2)} ({service.duration} min)
                    </span>
                  </div>
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
