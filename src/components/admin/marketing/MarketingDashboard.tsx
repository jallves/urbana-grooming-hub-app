
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Percent, ArrowUp, ArrowDown, Users, Eye, ShoppingBag, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MarketingDashboard: React.FC = () => {
  // Fetch active campaigns count
  const { data: campaignStats, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-dashboard-campaigns'],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('status')
        
      if (error) throw new Error(error.message);
      
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const totalCampaigns = campaigns.length;
      
      return {
        active: activeCampaigns,
        total: totalCampaigns
      };
    },
  });

  // Fetch coupons stats
  const { data: couponStats, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ['marketing-dashboard-coupons'],
    queryFn: async () => {
      const { data: coupons, error } = await supabase
        .from('discount_coupons')
        .select('is_active, current_uses')
        
      if (error) throw new Error(error.message);
      
      const activeCoupons = coupons.filter(c => c.is_active).length;
      const totalUsages = coupons.reduce((sum, coupon) => sum + (coupon.current_uses || 0), 0);
      
      return {
        active: activeCoupons,
        total: coupons.length,
        usages: totalUsages
      };
    },
  });

  // Mock data for recent metrics
  const recentMetrics = [
    {
      metric: 'Visualizações da Loja',
      value: '2.350',
      change: '+15%',
      trend: 'up'
    },
    {
      metric: 'Novos Clientes',
      value: '48',
      change: '+7%',
      trend: 'up'
    },
    {
      metric: 'Taxa de Conversão',
      value: '3.2%',
      change: '-0.5%',
      trend: 'down'
    },
    {
      metric: 'Valor Médio',
      value: 'R$ 185,30',
      change: '+12%',
      trend: 'up'
    },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      event: 'Cupom BEMVINDO20 utilizado',
      time: '2 horas atrás',
      value: 'R$ 78,50 de desconto'
    },
    {
      event: 'Campanha "Dia das Mães" iniciada',
      time: '1 dia atrás',
      value: '12 produtos em promoção'
    },
    {
      event: 'Novo cliente cadastrado',
      time: '1 dia atrás',
      value: 'Via campanha de Instagram'
    },
    {
      event: 'Cupom ANIVERSARIO15 criado',
      time: '2 dias atrás',
      value: '15% de desconto em todos produtos'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoadingCampaigns ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${campaignStats?.active || 0}`
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Percent className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isLoadingCampaigns ? (
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                `De ${campaignStats?.total || 0} campanhas no total`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoadingCoupons ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${couponStats?.active || 0}`
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Tag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isLoadingCoupons ? (
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                `De ${couponStats?.total || 0} cupons no total`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cupons Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoadingCoupons ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${couponStats?.usages || 0}`
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Registros de uso de cupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">3.2%</div>
              <Badge variant="outline" className="text-green-600">
                <ArrowUp className="h-3.5 w-3.5 mr-1" />
                +0.5%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Métricas Recentes</CardTitle>
            <CardDescription>Visão geral de desempenho dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentMetrics.map((item, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">{item.metric}</div>
                  <div className="text-xl font-bold mt-1">{item.value}</div>
                  <div className={`text-xs mt-1 flex items-center ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.trend === 'up' ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {item.change}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start px-2 py-1">
                  <div className="mr-2 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.event}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.value}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <a href="/admin/relatorios" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Relatórios Completos
          </a>
        </Button>
      </div>
    </div>
  );
};

export default MarketingDashboard;
