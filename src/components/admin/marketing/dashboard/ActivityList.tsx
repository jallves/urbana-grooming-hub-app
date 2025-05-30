
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ActivityListProps {
  activities?: Array<{
    event: string;
    time: string;
    value: string;
  }>;
}

const ActivityList: React.FC<ActivityListProps> = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['marketing-activities'],
    queryFn: async () => {
      // Fetch recent marketing activities from multiple sources
      const { data: campaigns, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      const { data: coupons, error: couponsError } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
        
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (campaignsError || couponsError || clientsError) {
        throw new Error('Erro ao carregar atividades');
      }
      
      // Combine and format activities
      const allActivities = [];
      
      // Add campaign activities
      campaigns?.forEach(campaign => {
        allActivities.push({
          event: `Campanha "${campaign.name}" ${campaign.status === 'active' ? 'iniciada' : 'criada'}`,
          time: formatDistanceToNow(new Date(campaign.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          }),
          value: campaign.budget ? `Orçamento: R$ ${Number(campaign.budget).toLocaleString('pt-BR')}` : 'Sem orçamento definido',
          date: new Date(campaign.created_at)
        });
      });
      
      // Add coupon activities
      coupons?.forEach(coupon => {
        const discountValue = coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}% de desconto`
          : `R$ ${Number(coupon.discount_value).toLocaleString('pt-BR')} de desconto`;
          
        allActivities.push({
          event: `Cupom "${coupon.code}" criado`,
          time: formatDistanceToNow(new Date(coupon.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          }),
          value: discountValue,
          date: new Date(coupon.created_at)
        });
      });
      
      // Add client activities
      clients?.forEach(client => {
        allActivities.push({
          event: `Novo cliente cadastrado`,
          time: formatDistanceToNow(new Date(client.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          }),
          value: client.name,
          date: new Date(client.created_at)
        });
      });
      
      // Sort by date and return top 6
      return allActivities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 6);
    }
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex justify-between items-start border-b pb-3 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.event}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  {activity.value}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade recente encontrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityList;
