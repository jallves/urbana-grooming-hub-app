import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { ArrowUp, ArrowDown, Star } from 'lucide-react';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  show_on_home: boolean;
  display_order: number;
}

const FeaturedServicesManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, show_on_home, display_order }: { id: string; show_on_home?: boolean; display_order?: number }) => {
      const updateData: any = {};
      if (show_on_home !== undefined) updateData.show_on_home = show_on_home;
      if (display_order !== undefined) updateData.display_order = display_order;

      const { error } = await supabase
        .from('painel_servicos')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services-featured'] });
      toast({
        title: "Serviço atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço",
        variant: "destructive",
      });
    }
  });

  const handleToggleFeatured = (id: string, currentValue: boolean) => {
    updateServiceMutation.mutate({ id, show_on_home: !currentValue });
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (!services) return;
    
    const currentIndex = services.findIndex(s => s.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= services.length) return;

    // Swap display_order
    updateServiceMutation.mutate({ id: services[currentIndex].id, display_order: services[newIndex].display_order });
    updateServiceMutation.mutate({ id: services[newIndex].id, display_order: services[currentIndex].display_order });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-urbana-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const featuredServices = services?.filter(s => s.show_on_home) || [];

  return (
    <div className="space-y-6">
      <div className="bg-urbana-gold/10 border border-urbana-gold/30 rounded-lg p-4">
        <p className="text-sm text-gray-700 font-raleway">
          ⭐ Selecione quais serviços aparecerão na página inicial do site. 
          Apenas serviços marcados como "Exibir na Home" serão mostrados para os visitantes.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {services?.map((service, index) => (
          <Card key={service.id} className="p-3 sm:p-4 bg-white border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                <div className={`p-2 rounded-lg flex-shrink-0 ${service.show_on_home ? 'bg-urbana-gold/20' : 'bg-gray-100'}`}>
                  <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${service.show_on_home ? 'text-urbana-gold fill-urbana-gold' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-playfair font-bold text-base sm:text-lg text-gray-900 truncate">{service.nome}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-raleway">
                    R$ {service.preco.toFixed(2)} • {service.duracao} min
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {service.show_on_home && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(service.id, 'up')}
                      disabled={index === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="ml-1 sm:hidden">Subir</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(service.id, 'down')}
                      disabled={index === services.length - 1}
                      className="flex-1 sm:flex-none"
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="ml-1 sm:hidden">Descer</span>
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between sm:justify-start gap-2 px-2 py-1 sm:p-0 bg-gray-50 sm:bg-transparent rounded">
                  <span className="text-xs sm:text-sm text-gray-600 font-raleway">
                    {service.show_on_home ? 'Visível na home' : 'Oculto da home'}
                  </span>
                  <Switch
                    checked={service.show_on_home}
                    onCheckedChange={() => handleToggleFeatured(service.id, service.show_on_home)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-raleway">
          💡 <strong>Dica:</strong> {featuredServices.length} {featuredServices.length === 1 ? 'serviço está' : 'serviços estão'} sendo exibido{featuredServices.length !== 1 ? 's' : ''} na home. 
          Use as setas para reordenar a exibição.
        </p>
      </div>
    </div>
  );
};

export default FeaturedServicesManager;
