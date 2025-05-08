
import React, { useState } from 'react';
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
        return 'success';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Campanhas de Marketing</CardTitle>
          <CardDescription>
            Gerencie suas campanhas de marketing
          </CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            Erro ao carregar campanhas. Por favor, tente novamente.
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{format(new Date(campaign.start_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {campaign.end_date ? format(new Date(campaign.end_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(campaign.status)}>
                      {getStatusName(campaign.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.budget ? `R$ ${campaign.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
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
