import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardMetrics } from '@/types/erp';
import { ContasAReceber } from './ContasAReceber';
import { ContasAPagar } from './ContasAPagar';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';

const FinancialDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['financial-dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

      const fetchMetrics = async (startDate: string) => {
        // Receitas
        const { data: revenues, error: revenuesError } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'revenue')
          .gte('transaction_date', startDate);

        if (revenuesError) {
          console.error('Error fetching revenues:', revenuesError);
        }

        // Despesas
        const { data: expenses, error: expensesError } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startDate);

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
        }

        // Comissões
        const { data: commissions, error: commissionsError } = await supabase
          .from('financial_records')
          .select('net_amount, status')
          .eq('transaction_type', 'commission')
          .gte('transaction_date', startDate);

        if (commissionsError) {
          console.error('Error fetching commissions:', commissionsError);
        }

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

      console.log('📊 Metrics loaded:', { today_metrics, week_metrics, month_metrics, year_metrics });

      return {
        today: today_metrics,
        week: week_metrics,
        month: month_metrics,
        year: year_metrics
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: 3,
    retryDelay: 1000
  });

  if (error) {
    console.error('❌ Error loading financial metrics:', error);
  }

  // Garantir que temos dados válidos antes de renderizar
  if (isLoading || !metrics || !metrics.month) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Garantir valores padrão para evitar undefined
  const safeMetrics = {
    month: {
      total_revenue: metrics.month?.total_revenue || 0,
      total_expenses: metrics.month?.total_expenses || 0,
      total_commissions: metrics.month?.total_commissions || 0,
      net_profit: metrics.month?.net_profit || 0,
      profit_margin: metrics.month?.profit_margin || 0,
      transaction_count: metrics.month?.transaction_count || 0,
      pending_amount: metrics.month?.pending_amount || 0
    }
  };

  const summaryCards = [
    {
      title: 'Receita Total',
      value: `R$ ${safeMetrics.month.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12.5%'
    },
    {
      title: 'Despesas',
      value: `R$ ${safeMetrics.month.total_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '-3.2%'
    },
    {
      title: 'Comissões',
      value: `R$ ${safeMetrics.month.total_commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+8.1%'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${safeMetrics.month.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: safeMetrics.month.net_profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: safeMetrics.month.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50',
      trend: `${safeMetrics.month.profit_margin.toFixed(1)}% margem`
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

      {/* Tabs Principais: Contas a Receber, Contas a Pagar e Fluxo de Caixa */}
      <Tabs defaultValue="receber" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-auto p-1 gap-1">
          <TabsTrigger 
            value="receber"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs sm:text-sm lg:text-base py-2 sm:py-3 font-semibold rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
          >
            <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Contas a Receber</span>
            <span className="sm:hidden">Receber</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pagar"
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs sm:text-sm lg:text-base py-2 sm:py-3 font-semibold rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
          >
            <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Contas a Pagar</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
          <TabsTrigger 
            value="fluxo"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs sm:text-sm lg:text-base py-2 sm:py-3 font-semibold rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
          >
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
            <span className="sm:hidden">Fluxo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="mt-6">
          <ContasAReceber />
        </TabsContent>

        <TabsContent value="pagar" className="mt-6">
          <ContasAPagar />
        </TabsContent>

        <TabsContent value="fluxo" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <CashFlowManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
