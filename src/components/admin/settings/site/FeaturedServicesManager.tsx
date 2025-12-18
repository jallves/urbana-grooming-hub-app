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
  show_on_home: boolean;
  display_order: number;
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
        .select('*')
        .eq('is_active', true)
        .order('show_on_home', { ascending: false })
        .order('display_order', { ascending: true })
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, show_on_home, display_order }: { id: string; show_on_home?: boolean; display_order?: number }) => {
      const updateData: any = {};
      if (show_on_home !== undefined) updateData.show_on_home = show_on_home;
      if (display_order !== undefined) updateData.display_order = display_order;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('painel_servicos')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalida ambos os caches para sincronizar admin e home
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

  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; display_order: number }>) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('painel_servicos')
          .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services-featured'] });
      queryClient.invalidateQueries({ queryKey: ['home-services'] });
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos serviços foi alterada com sucesso",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reordenar os serviços",
        variant: "destructive",
      });
    }
  });

  const handleToggleFeatured = (id: string, currentValue: boolean) => {
    // Se está marcando como visível na home, atribui o próximo display_order
    const featuredServices = services?.filter(s => s.show_on_home) || [];
    const maxOrder = featuredServices.length > 0 
      ? Math.max(...featuredServices.map(s => s.display_order || 0)) 
      : -1;
    
    updateServiceMutation.mutate({ 
      id, 
      show_on_home: !currentValue,
      display_order: !currentValue ? maxOrder + 1 : 0
    });
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (!services) return;
    
    // Filtra apenas os serviços visíveis na home para reordenar
    const featuredServices = services.filter(s => s.show_on_home);
    const currentIndex = featuredServices.findIndex(s => s.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= featuredServices.length) return;

    // Cria array com nova ordem
    const reordered = [...featuredServices];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, movedItem);

    // Atualiza display_order de todos os itens reordenados
    const updates = reordered.map((service, index) => ({
      id: service.id,
      display_order: index
    }));

    batchUpdateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-urbana-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const featuredServices = services?.filter(s => s.show_on_home) || [];
  const hiddenServices = services?.filter(s => !s.show_on_home) || [];

  return (
    <div className="space-y-6">
      <div className="bg-urbana-gold/10 border border-urbana-gold/30 rounded-lg p-4">
        <p className="text-sm text-gray-700 font-raleway">
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
            {featuredServices
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((service, index) => (
              <Card key={service.id} className="p-3 bg-green-50 border-green-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className={`p-2 rounded-lg flex-shrink-0 bg-urbana-gold/20`}>
                    <Star className="h-4 w-4 text-urbana-gold fill-urbana-gold" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-playfair font-bold text-sm text-gray-900 truncate">
                      {service.nome}
                    </h4>
                    <p className="text-xs text-gray-600 font-raleway">
                      R$ {service.preco.toFixed(2)} • {service.duracao} min
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorder(service.id, 'up')}
                        disabled={index === 0 || batchUpdateMutation.isPending}
                        className="h-8 px-2"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorder(service.id, 'down')}
                        disabled={index === featuredServices.length - 1 || batchUpdateMutation.isPending}
                        className="h-8 px-2"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <span className="text-xs text-green-700 font-medium hidden sm:inline">
                        Visível
                      </span>
                      <Switch
                        checked={service.show_on_home}
                        onCheckedChange={() => handleToggleFeatured(service.id, service.show_on_home)}
                        disabled={updateServiceMutation.isPending}
                      />
                    </div>
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
                  <div className={`p-2 rounded-lg flex-shrink-0 bg-gray-100`}>
                    <Star className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-playfair font-bold text-sm text-gray-700 truncate">
                      {service.nome}
                    </h4>
                    <p className="text-xs text-gray-500 font-raleway">
                      R$ {service.preco.toFixed(2)} • {service.duracao} min
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      Oculto
                    </span>
                    <Switch
                      checked={service.show_on_home}
                      onCheckedChange={() => handleToggleFeatured(service.id, service.show_on_home)}
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
        <p className="text-sm text-blue-800 font-raleway">
          💡 <strong>Dica:</strong> {featuredServices.length} {featuredServices.length === 1 ? 'serviço está' : 'serviços estão'} sendo exibido{featuredServices.length !== 1 ? 's' : ''} na home. 
          Use as setas para reordenar a exibição. As alterações são refletidas automaticamente na página inicial.
        </p>
      </div>
    </div>
  );
};

export default FeaturedServicesManager;
