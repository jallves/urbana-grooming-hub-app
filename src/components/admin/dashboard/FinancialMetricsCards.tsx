import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CreditCard, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialMetricsCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['financial-dashboard-metrics'],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

      // Previous month for comparison
      const firstDayOfLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      // Current month data
      const { data: currentData } = await supabase
        .from('financial_records')
        .select('transaction_type, status, net_amount, due_date')
        .gte('transaction_date', firstDayOfMonth)
        .lte('transaction_date', lastDayOfMonth);

      // Previous month data
      const { data: previousData } = await supabase
        .from('financial_records')
        .select('transaction_type, status, net_amount')
        .gte('transaction_date', firstDayOfLastMonth)
        .lte('transaction_date', lastDayOfLastMonth);

      // Calculate current month metrics
      const currentRevenue = currentData?.filter(r => r.transaction_type === 'revenue' && r.status === 'completed').reduce((sum, r) => sum + r.net_amount, 0) || 0;
      const currentExpenses = currentData?.filter(r => r.transaction_type === 'expense' && r.status === 'completed').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;
      const currentCommissions = currentData?.filter(r => r.transaction_type === 'commission' && r.status === 'completed').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;

      // Previous month metrics
      const previousRevenue = previousData?.filter(r => r.transaction_type === 'revenue' && r.status === 'completed').reduce((sum, r) => sum + r.net_amount, 0) || 0;
      const previousExpenses = previousData?.filter(r => r.transaction_type === 'expense' && r.status === 'completed').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;

      // Pending accounts
      const pendingReceivables = currentData?.filter(r => r.transaction_type === 'revenue' && r.status === 'pending').reduce((sum, r) => sum + r.net_amount, 0) || 0;
      const pendingPayables = currentData?.filter(r => r.transaction_type === 'expense' && r.status === 'pending').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;
      const pendingCommissions = currentData?.filter(r => r.transaction_type === 'commission' && r.status === 'pending').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;

      // Overdue accounts
      const today = new Date().toISOString();
      const overdueReceivables = currentData?.filter(r => r.transaction_type === 'revenue' && r.status === 'pending' && r.due_date && r.due_date < today).length || 0;
      const overduePayables = currentData?.filter(r => r.transaction_type === 'expense' && r.status === 'pending' && r.due_date && r.due_date < today).length || 0;

      // Calculate profit and trends
      const currentProfit = currentRevenue - currentExpenses - currentCommissions;
      const previousProfit = previousRevenue - previousExpenses;
      
      const revenueTrend = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const expenseTrend = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
      const profitTrend = previousProfit ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;

      return {
        revenue: currentRevenue,
        expenses: currentExpenses,
        commissions: currentCommissions,
        profit: currentProfit,
        revenueTrend,
        expenseTrend,
        profitTrend,
        pendingReceivables,
        pendingPayables,
        pendingCommissions,
        overdueReceivables,
        overduePayables,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Receita do Mês',
      value: `R$ ${metrics?.revenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: metrics?.revenueTrend || 0,
      subtitle: `${metrics?.pendingReceivables ? `R$ ${metrics.pendingReceivables.toFixed(2)} pendente` : 'Nenhuma pendência'}`,
      alert: (metrics?.overdueReceivables || 0) > 0 ? `${metrics?.overdueReceivables} vencida(s)` : null,
    },
    {
      title: 'Despesas do Mês',
      value: `R$ ${metrics?.expenses.toFixed(2) || '0.00'}`,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: metrics?.expenseTrend || 0,
      subtitle: `${metrics?.pendingPayables ? `R$ ${metrics.pendingPayables.toFixed(2)} pendente` : 'Nenhuma pendência'}`,
      alert: (metrics?.overduePayables || 0) > 0 ? `${metrics?.overduePayables} vencida(s)` : null,
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${metrics?.profit.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: metrics && metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: metrics && metrics.profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      trend: metrics?.profitTrend || 0,
      subtitle: `Margem: ${metrics && metrics.revenue ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0'}%`,
    },
    {
      title: 'Comissões',
      value: `R$ ${metrics?.commissions.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `${metrics?.pendingCommissions ? `R$ ${metrics.pendingCommissions.toFixed(2)} pendente` : 'Nenhuma pendência'}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositiveTrend = (card.trend || 0) > 0;
        const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
              
              {card.trend !== undefined && (
                <div className={`flex items-center mt-1 text-xs ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  <span>{Math.abs(card.trend).toFixed(1)}% vs mês anterior</span>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              
              {card.alert && (
                <div className="flex items-center mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {card.alert}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FinancialMetricsCards;
