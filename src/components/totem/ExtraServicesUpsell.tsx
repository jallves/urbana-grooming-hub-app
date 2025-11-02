import React, { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface ExtraServicesUpsellProps {
  currentServiceId: string;
  onServicesSelected: (services: Service[]) => void;
  className?: string;
}

/**
 * Componente de sugestão de serviços adicionais no checkout
 * Fase 2: Aumentar ticket médio
 */
export const ExtraServicesUpsell: React.FC<ExtraServicesUpsellProps> = ({
  currentServiceId,
  onServicesSelected,
  className,
}) => {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedServices();
  }, [currentServiceId]);

  useEffect(() => {
    onServicesSelected(selectedServices);
  }, [selectedServices, onServicesSelected]);

  const fetchSuggestedServices = async () => {
    try {
      // Buscar serviços complementares (excluir o serviço atual)
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao')
        .neq('id', currentServiceId)
        .order('preco', { ascending: true })
        .limit(4);

      if (error) throw error;

      setAvailableServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços sugeridos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const isSelected = (serviceId: string) => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  if (loading || availableServices.length === 0) {
    return null;
  }

  return (
    <Card className={cn('bg-urbana-black-soft border-urbana-gold/20 p-6', className)}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-urbana-light mb-2">
          Aproveite e adicione:
        </h3>
        <p className="text-urbana-light/60">
          Serviços complementares para completar seu visual
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableServices.map((service) => {
          const selected = isSelected(service.id);
          
          return (
            <button
              key={service.id}
              onClick={() => toggleService(service)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200',
                'hover:scale-105 active:scale-95',
                selected
                  ? 'bg-urbana-gold/20 border-urbana-gold shadow-lg shadow-urbana-gold/20'
                  : 'bg-urbana-black border-urbana-gold/20 hover:border-urbana-gold/40'
              )}
            >
              {/* Check icon */}
              {selected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-urbana-gold flex items-center justify-center">
                  <Check className="w-4 h-4 text-urbana-black" strokeWidth={3} />
                </div>
              )}

              <div className="text-left">
                <h4 className="text-lg font-semibold text-urbana-light mb-1">
                  {service.nome}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-urbana-gold">
                    R$ {service.preco.toFixed(2)}
                  </span>
                  <span className="text-sm text-urbana-light/60">
                    {service.duracao} min
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedServices.length > 0 && (
        <div className="mt-6 p-4 bg-urbana-gold/10 rounded-lg border border-urbana-gold/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-urbana-light/70 text-sm">
                {selectedServices.length} {selectedServices.length === 1 ? 'serviço adicional' : 'serviços adicionais'}
              </p>
              <p className="text-2xl font-bold text-urbana-gold">
                + R${' '}
                {selectedServices
                  .reduce((sum, s) => sum + s.preco, 0)
                  .toFixed(2)}
              </p>
            </div>
            <Plus className="w-8 h-8 text-urbana-gold" />
          </div>
        </div>
      )}
    </Card>
  );
};
