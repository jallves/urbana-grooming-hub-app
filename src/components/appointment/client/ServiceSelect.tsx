
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { Scissors, Clock, DollarSign } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  is_active: boolean;
}

interface ServiceSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
  onServiceChange?: (serviceId: string) => void;
}

const ServiceSelect: React.FC<ServiceSelectProps> = ({
  services,
  form,
  onServiceChange
}) => {
  console.log('[ServiceSelect] Renderizando com serviços:', services);

  if (services.length === 0) {
    return (
      <FormField
        control={form.control}
        name="service_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Escolha o Serviço
            </FormLabel>
            <div className="p-6 bg-stone-700 border border-stone-600 rounded-lg text-stone-400 text-center">
              <Scissors className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p>Carregando serviços...</p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold text-white flex items-center gap-2">
            <Scissors className="h-5 w-5 text-amber-500" />
            Escolha o Serviço
          </FormLabel>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {services.map((service) => {
              const isSelected = field.value === service.id;
              
              return (
                <div
                  key={service.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 p-4 rounded-lg border-2 ${
                    isSelected 
                      ? 'ring-2 ring-amber-500 bg-stone-700 border-amber-500' 
                      : 'bg-stone-800 border-stone-600 hover:border-stone-500'
                  }`}
                  onClick={() => {
                    field.onChange(service.id);
                    onServiceChange?.(service.id);
                    console.log('[ServiceSelect] Serviço selecionado:', service.name);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-white text-lg">{service.name}</h3>
                      {isSelected && (
                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-black text-sm">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {service.description && (
                      <p className="text-stone-300 text-sm line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-stone-400">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} min</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>R$ {service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ServiceSelect;
