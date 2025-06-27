
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { Service } from '@/types/appointment';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign } from 'lucide-react';

interface ClientServiceSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
  onServiceChange?: (serviceId: string) => void;
}

const ClientServiceSelect: React.FC<ClientServiceSelectProps> = ({
  services,
  form,
  onServiceChange
}) => {
  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Serviço *</FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              onServiceChange?.(value);
              // Reset staff selection when service changes
              form.setValue('staff_id', '');
            }}
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1F2937] border-gray-600">
              {services.map((service) => (
                <SelectItem 
                  key={service.id} 
                  value={service.id}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-medium">{service.name}</span>
                      <Badge variant="secondary" className="bg-[#F59E0B] text-black">
                        R$ {service.price.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration} min
                      </div>
                      {service.description && (
                        <span className="truncate max-w-[200px]">
                          {service.description}
                        </span>
                      )}
                    </div>
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
};

export default ClientServiceSelect;
