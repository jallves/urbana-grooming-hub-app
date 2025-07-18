
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MarketingCampaign } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
          refetch(); // Refresh data when changes occur
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
      case 'active':
        return 'default';
      case 'draft':
        return 'outline';
      case 'completed':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'draft':
        return 'Rascunho';
      case 'completed':
        return 'Concluída';
      case 'canceled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Campanhas de Marketing</CardTitle>
          <CardDescription className="text-gray-400">
            Gerencie suas campanhas de marketing
          </CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-white">Carregando...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-4">
            Erro ao carregar campanhas. Por favor, tente novamente.
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Nome</TableHead>
                  <TableHead className="text-white">Data Início</TableHead>
                  <TableHead className="text-white">Data Fim</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Orçamento</TableHead>
                  <TableHead className="text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                    <TableCell className="text-gray-300">{format(new Date(campaign.start_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-gray-300">
                      {campaign.end_date ? format(new Date(campaign.end_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(campaign.status)}>
                        {getStatusName(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {campaign.budget ? `R$ ${campaign.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)} className="border-gray-600 text-white hover:bg-gray-800">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Nenhuma campanha encontrada. Crie uma nova campanha para começar.
          </div>
        )}
      </CardContent>
      
      <CampaignForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCampaign(null);
        }}
        onSubmit={handleFormSubmit}
        campaign={selectedCampaign}
      />
    </Card>
  );
};

export default CampaignList;
