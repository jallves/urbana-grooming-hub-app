import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Activity,
  CreditCard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardMetrics } from '@/types/erp';
import { FinancialTransactionsList } from './FinancialTransactionsList';

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de Período */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-200 h-auto">
          <TabsTrigger 
            value="today"
            className="text-xs sm:text-sm py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Hoje
          </TabsTrigger>
          <TabsTrigger 
            value="week"
            className="text-xs sm:text-sm py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Semana
          </TabsTrigger>
          <TabsTrigger 
            value="month"
            className="text-xs sm:text-sm py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Mês
          </TabsTrigger>
          <TabsTrigger 
            value="year"
            className="text-xs sm:text-sm py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Ano
          </TabsTrigger>
        </TabsList>

        {['today', 'week', 'month', 'year'].map(period => (
          <TabsContent key={period} value={period} className="space-y-3 sm:space-y-4 mt-3 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-white border-gray-200">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm text-gray-700">Transações</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {metrics?.[period as keyof DashboardMetrics]?.transaction_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm text-gray-700">Pendente</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                    <span className="text-lg sm:text-2xl font-bold text-yellow-600">
                      R$ {(metrics?.[period as keyof DashboardMetrics]?.pending_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 sm:col-span-2 lg:col-span-1">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm text-gray-700">Margem</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {metrics?.[period as keyof DashboardMetrics]?.profit_margin.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Lista de Transações */}
      <div className="mt-6">
        <FinancialTransactionsList />
      </div>
    </div>
  );
};

export default FinancialDashboard;
