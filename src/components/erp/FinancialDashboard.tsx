import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Package,
  Users,
  CreditCard,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardMetrics } from '@/types/erp';

const FinancialDashboard: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['financial-dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

      const fetchMetrics = async (startDate: string) => {
        // Receitas
        const { data: revenues } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'revenue')
          .gte('transaction_date', startDate);

        // Despesas
        const { data: expenses } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startDate);

        // Comissões
        const { data: commissions } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'commission')
          .gte('transaction_date', startDate);

        const total_revenue = revenues
          ?.filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + Number(r.net_amount), 0) || 0;

        const total_expenses = expenses
          ?.filter(e => e.status === 'completed')
          .reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;

        const total_commissions = commissions
          ?.reduce((sum, c) => sum + Number(c.net_amount), 0) || 0;

        const pending_amount = revenues
          ?.filter(r => r.status === 'pending')
          .reduce((sum, r) => sum + Number(r.net_amount), 0) || 0;

        const net_profit = total_revenue - total_expenses - total_commissions;
        const profit_margin = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

        return {
          total_revenue,
          total_expenses,
          total_commissions,
          net_profit,
          profit_margin,
          transaction_count: (revenues?.length || 0) + (expenses?.length || 0),
          pending_amount
        };
      };

      const [today_metrics, week_metrics, month_metrics, year_metrics] = await Promise.all([
        fetchMetrics(startOfToday),
        fetchMetrics(startOfWeek),
        fetchMetrics(startOfMonth),
        fetchMetrics(startOfYear)
      ]);

      return {
        today: today_metrics,
        week: week_metrics,
        month: month_metrics,
        year: year_metrics
      };
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Receita Total',
      value: `R$ ${(metrics?.month.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12.5%'
    },
    {
      title: 'Despesas',
      value: `R$ ${(metrics?.month.total_expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '-3.2%'
    },
    {
      title: 'Comissões',
      value: `R$ ${(metrics?.month.total_commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+8.1%'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${(metrics?.month.net_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: metrics?.month.net_profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics?.month.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: `${metrics?.month.profit_margin.toFixed(1)}% margem`
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de Período */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="year">Ano</TabsTrigger>
        </TabsList>

        {['today', 'week', 'month', 'year'].map(period => (
          <TabsContent key={period} value={period} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {metrics?.[period as keyof DashboardMetrics]?.transaction_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-600">
                      R$ {(metrics?.[period as keyof DashboardMetrics]?.pending_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Margem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {metrics?.[period as keyof DashboardMetrics]?.profit_margin.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
