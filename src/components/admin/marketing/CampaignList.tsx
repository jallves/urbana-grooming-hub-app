
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MarketingCampaign } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import CampaignForm from './CampaignForm';

const CampaignList = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const { toast } = useToast();

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as MarketingCampaign[];
    },
  });

  // Set up real-time subscription for campaigns
  useEffect(() => {
    const channel = supabase
      .channel('campaign-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'marketing_campaigns'
        },
        (payload) => {
          console.log('Campaign data changed:', payload);
          toast({
            title: 'Atualização',
            description: 'Dados de campanhas atualizados'
          });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  const handleEdit = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    setIsDialogOpen(false);
    setSelectedCampaign(null);
    refetch();
    toast({
      title: 'Sucesso',
      description: 'Campanha salva com sucesso!',
    });
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'outline';
      case 'completed': return 'secondary';
      case 'canceled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'draft': return 'Rascunho';
      case 'completed': return 'Concluída';
      case 'canceled': return 'Cancelada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p className="text-sm">Erro ao carregar campanhas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Campanhas de Marketing</h3>
          <p className="text-xs text-gray-400">Gerencie suas campanhas</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 h-auto"
        >
          <Plus className="mr-1 h-3 w-3" />
          Nova
        </Button>
      </div>

      {/* Campaigns Grid */}
      {campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => handleEdit(campaign)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-white line-clamp-2">
                    {campaign.name}
                  </CardTitle>
                  <Badge variant={getBadgeVariant(campaign.status)} className="text-xs">
                    {getStatusName(campaign.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {campaign.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {campaign.description}
                  </p>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(campaign.start_date), 'dd/MM/yyyy')}</span>
                    {campaign.end_date && (
                      <>
                        <span>-</span>
                        <span>{format(new Date(campaign.end_date), 'dd/MM/yyyy')}</span>
                      </>
                    )}
                  </div>
                  
                  {campaign.budget && (
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <DollarSign className="h-3 w-3" />
                      <span>R$ {campaign.budget.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-8 w-8 text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Nenhuma campanha encontrada
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            Crie uma nova campanha para começar
          </p>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Campanha
          </Button>
        </div>
      )}
      
      <CampaignForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCampaign(null);
        }}
        onSubmit={handleFormSubmit}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default CampaignList;
