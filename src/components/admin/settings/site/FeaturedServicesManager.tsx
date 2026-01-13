import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { ArrowUp, ArrowDown, Star, Eye, EyeOff, GripVertical } from 'lucide-react';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  exibir_home: boolean;
  is_active: boolean;
}

const FeaturedServicesManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao, exibir_home, is_active')
        .eq('is_active', true)
        .order('exibir_home', { ascending: false })
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, exibir_home }: { id: string; exibir_home: boolean }) => {
      const { error } = await supabase
        .from('painel_servicos')
        .update({ exibir_home, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services-featured'] });
      queryClient.invalidateQueries({ queryKey: ['home-services'] });
      toast({
        title: "Serviço atualizado",
        description: "As alterações foram salvas e serão refletidas na home",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o serviço",
        variant: "destructive",
      });
    }
  });

  const handleToggleFeatured = (id: string, currentValue: boolean) => {
    updateServiceMutation.mutate({ id, exibir_home: !currentValue });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const featuredServices = services?.filter(s => s.exibir_home) || [];
  const hiddenServices = services?.filter(s => !s.exibir_home) || [];

  return (
    <div className="space-y-6">
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          ⭐ Selecione quais serviços aparecerão na página inicial do site. 
          Apenas serviços marcados como "Visível na Home" serão mostrados para os visitantes.
        </p>
      </div>

      {/* Serviços visíveis na home */}
      {featuredServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-600" />
            Visíveis na Home ({featuredServices.length})
          </h3>
          <div className="grid gap-2">
            {featuredServices.map((service, index) => (
              <Card key={service.id} className="p-3 bg-green-50 border-green-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="p-2 rounded-lg flex-shrink-0 bg-yellow-100">
                    <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate">
                      {service.nome}
                    </h4>
                    <p className="text-xs text-gray-600">
                      R$ {service.preco.toFixed(2)} • {service.duracao} min
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-green-700 font-medium hidden sm:inline">
                      Visível
                    </span>
                    <Switch
                      checked={service.exibir_home}
                      onCheckedChange={() => handleToggleFeatured(service.id, service.exibir_home)}
                      disabled={updateServiceMutation.isPending}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Serviços ocultos da home */}
      {hiddenServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-gray-400" />
            Ocultos da Home ({hiddenServices.length})
          </h3>
          <div className="grid gap-2">
            {hiddenServices.map((service) => (
              <Card key={service.id} className="p-3 bg-gray-50 border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0 bg-gray-100">
                    <Star className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-700 truncate">
                      {service.nome}
                    </h4>
                    <p className="text-xs text-gray-500">
                      R$ {service.preco.toFixed(2)} • {service.duracao} min
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      Oculto
                    </span>
                    <Switch
                      checked={service.exibir_home}
                      onCheckedChange={() => handleToggleFeatured(service.id, service.exibir_home)}
                      disabled={updateServiceMutation.isPending}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dica */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> {featuredServices.length} {featuredServices.length === 1 ? 'serviço está' : 'serviços estão'} sendo exibido{featuredServices.length !== 1 ? 's' : ''} na home. 
          As alterações são refletidas automaticamente na página inicial.
        </p>
      </div>
    </div>
  );
};

export default FeaturedServicesManager;
