
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Scissors } from 'lucide-react';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceSelectionStepProps {
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  selectedService,
  onServiceSelect
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setServices(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar serviços:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Scissors className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Escolha seu serviço
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onServiceSelect(service)}
            className={`
              bg-gray-800 rounded-lg p-6 cursor-pointer transition-all border-2
              hover:bg-gray-750 hover:border-amber-500/50
              ${selectedService?.id === service.id 
                ? 'border-amber-500 bg-amber-500/10' 
                : 'border-gray-700'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-xl font-semibold text-white">
                {service.name}
              </h4>
              {selectedService?.id === service.id && (
                <Badge className="bg-amber-500 text-black">
                  Selecionado
                </Badge>
              )}
            </div>

            {service.description && (
              <p className="text-gray-400 mb-4 line-clamp-2">
                {service.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{service.duration} min</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-8">
          <Scissors className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum serviço disponível no momento.</p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelectionStep;
