import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CreditCard, Wallet, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const FinancialMetricsCards: React.FC = () => {
  const { toast } = useToast();
  const { data: metrics, isLoading, refetch } = useQuery({
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
      const { data: currentData, error: currentError } = await supabase
        .from('financial_records')
        .select('transaction_type, status, net_amount, due_date')
        .gte('transaction_date', firstDayOfMonth.split('T')[0])
        .lte('transaction_date', lastDayOfMonth.split('T')[0]);

      if (currentError) {
        console.error('Error fetching current data:', currentError);
        throw currentError;
      }

      // Previous month data
      const { data: previousData, error: previousError } = await supabase
        .from('financial_records')
        .select('transaction_type, status, net_amount')
        .gte('transaction_date', firstDayOfLastMonth.split('T')[0])
        .lte('transaction_date', lastDayOfLastMonth.split('T')[0]);

      if (previousError) {
        console.error('Error fetching previous data:', previousError);
        throw previousError;
      }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="bg-white border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Receita do Mês',
      value: `R$ ${(metrics?.revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: metrics?.revenueTrend || 0,
      subtitle: metrics?.pendingReceivables && metrics.pendingReceivables > 0
        ? `R$ ${metrics.pendingReceivables.toFixed(2)} a receber`
        : '✓ Tudo recebido',
      alert: (metrics?.overdueReceivables || 0) > 0 ? `${metrics?.overdueReceivables} vencida(s)` : null,
    },
    {
      title: 'Despesas do Mês',
      value: `R$ ${(metrics?.expenses || 0).toFixed(2)}`,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: metrics?.expenseTrend || 0,
      subtitle: metrics?.pendingPayables && metrics.pendingPayables > 0
        ? `R$ ${metrics.pendingPayables.toFixed(2)} a pagar`
        : '✓ Todas as despesas pagas',
      alert: (metrics?.overduePayables || 0) > 0 ? `${metrics?.overduePayables} vencida(s)` : null,
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${(metrics?.profit || 0).toFixed(2)}`,
      icon: Wallet,
      color: metrics && metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: metrics && metrics.profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      trend: metrics?.profitTrend || 0,
      subtitle: `Margem: ${metrics && metrics.revenue ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0'}%`,
    },
    {
      title: 'Comissões do Mês',
      value: `R$ ${(metrics?.commissions || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: metrics?.pendingCommissions && metrics.pendingCommissions > 0
        ? `R$ ${metrics.pendingCommissions.toFixed(2)} a pagar aos barbeiros`
        : '✓ Todas as comissões pagas',
    },
  ];

  const handleRefresh = async () => {
    toast({
      title: "Atualizando...",
      description: "Buscando dados atualizados",
    });
    await refetch();
    toast({
      title: "Atualizado!",
      description: "Dados financeiros atualizados com sucesso",
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation text-xs sm:text-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositiveTrend = (card.trend || 0) > 0;
        const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-2">
                {card.title}
              </CardTitle>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {card.value}
              </div>
              
              {card.trend !== undefined && (
                <div className={`flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                  <span className="truncate">{Math.abs(card.trend).toFixed(1)}% vs mês anterior</span>
                </div>
              )}
              
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 truncate">{card.subtitle}</p>
              
              {card.alert && (
                <div className="flex items-center mt-1 sm:mt-2 text-[10px] sm:text-xs text-orange-600 bg-orange-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                  <AlertCircle className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                  <span className="truncate">{card.alert}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
};

export default FinancialMetricsCards;
