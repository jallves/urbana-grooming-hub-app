
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MetricsSection: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['marketing-dashboard-metrics'],
    queryFn: async () => {
      // Fetch real data from multiple tables
      const { data: campaigns, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*');
      
      const { data: coupons, error: couponsError } = await supabase
        .from('discount_coupons')
        .select('*');
        
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');
        
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('status', 'completed');
      
      if (campaignsError || couponsError || clientsError || appointmentsError) {
        throw new Error('Erro ao carregar métricas');
      }
      
      // Calculate metrics
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const activeCoupons = coupons?.filter(c => c.is_active).length || 0;
      const totalClients = clients?.length || 0;
      
      // Calculate current month new clients
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newClientsThisMonth = clients?.filter(client => {
        const clientDate = new Date(client.created_at);
        return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
      }).length || 0;
      
      // Calculate revenue this month
      const revenueThisMonth = appointments?.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
      }).reduce((sum, apt) => sum + Number(apt.services?.price || 0), 0) || 0;
      
      // Calculate conversion rate (appointments vs clients ratio)
      const totalAppointments = appointments?.length || 0;
      const conversionRate = totalClients > 0 ? (totalAppointments / totalClients * 100) : 0;
      
      return {
        activeCampaigns,
        activeCoupons,
        newClientsThisMonth,
        revenueThisMonth,
        conversionRate: Math.round(conversionRate * 10) / 10
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: 'Campanhas Ativas',
      value: metrics?.activeCampaigns || 0,
      description: 'Campanhas em execução',
      icon: Target,
      trend: 'stable'
    },
    {
      title: 'Cupons Ativos',
      value: metrics?.activeCoupons || 0,
      description: 'Cupons disponíveis para uso',
      icon: Percent,
      trend: 'stable'
    },
    {
      title: 'Novos Clientes',
      value: metrics?.newClientsThisMonth || 0,
      description: 'Cadastros este mês',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Receita do Mês',
      value: `R$ ${metrics?.revenueThisMonth?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      description: 'Faturamento atual',
      icon: DollarSign,
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                         metric.trend === 'down' ? TrendingDown : null;
        
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {TrendIcon && (
                      <TrendIcon className={`w-4 h-4 ${
                        metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`} />
                    )}
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsSection;
