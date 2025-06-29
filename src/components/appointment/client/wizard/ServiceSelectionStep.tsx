
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Scissors, Clock, DollarSign } from 'lucide-react';
import { Service } from '@/types/appointment';

interface ServiceSelectionStepProps {
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
  services: Service[];
  loading: boolean;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  selectedService,
  onServiceSelect,
  services,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-700 rounded w-20"></div>
            </div>
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
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-2">
                  {service.name}
                </h4>
                {service.description && (
                  <p className="text-sm text-gray-400 mb-3">
                    {service.description}
                  </p>
                )}
              </div>
              {selectedService?.id === service.id && (
                <Badge className="bg-amber-500 text-black ml-2">
                  Selecionado
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-500">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{service.duration} min</span>
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
