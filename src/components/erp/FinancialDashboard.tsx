import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardMetrics } from '@/types/erp';
import { ContasAReceber } from './ContasAReceber';
import { ContasAPagar } from './ContasAPagar';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';

const FinancialDashboard: React.FC = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  
  // Gerar lista de anos (2025 até 2035)
  const years = Array.from({ length: 11 }, (_, i) => (2025 + i).toString());
  
  // Query para dados anuais dos cards superiores
  const { data: yearlyMetrics, isLoading } = useQuery({
    queryKey: ['financial-yearly-metrics', selectedYear],
    queryFn: async () => {
      const year = parseInt(selectedYear);
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      // Receitas do ano
      const { data: revenues } = await supabase
        .from('financial_records')
        .select('net_amount')
        .eq('transaction_type', 'revenue')
        .eq('status', 'completed')
        .gte('transaction_date', startOfYear)
        .lte('transaction_date', endOfYear);

      // Despesas do ano (expense + commission = TUDO)
      const { data: expenses } = await supabase
        .from('financial_records')
        .select('net_amount')
        .in('transaction_type', ['expense', 'commission'])
        .eq('status', 'completed')
        .gte('transaction_date', startOfYear)
        .lte('transaction_date', endOfYear);

      // Comissões do ano (APENAS commission - para exibição separada)
      const { data: commissions } = await supabase
        .from('financial_records')
        .select('net_amount')
        .eq('transaction_type', 'commission')
        .eq('status', 'completed')
        .gte('transaction_date', startOfYear)
        .lte('transaction_date', endOfYear);

      const total_revenue = revenues?.reduce((sum, r) => sum + Number(r.net_amount), 0) || 0;
      const total_expenses = expenses?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;
      const total_commissions = commissions?.reduce((sum, c) => sum + Number(c.net_amount), 0) || 0;
      const net_profit = total_revenue - total_expenses;

      return {
        total_revenue,
        total_expenses,
        total_commissions,
        net_profit
      };
    },
    refetchInterval: 30000,
  });

  const { data: metrics, error } = useQuery({
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
  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Garantir valores padrão para evitar undefined - usar fallback em todos os níveis
  const monthMetrics = metrics?.month || {
    total_revenue: 0,
    total_expenses: 0,
    total_commissions: 0,
    net_profit: 0,
    profit_margin: 0,
    transaction_count: 0,
    pending_amount: 0
  };

  const safeMetrics = {
    month: {
      total_revenue: monthMetrics.total_revenue || 0,
      total_expenses: monthMetrics.total_expenses || 0,
      total_commissions: monthMetrics.total_commissions || 0,
      net_profit: monthMetrics.net_profit || 0,
      profit_margin: monthMetrics.profit_margin || 0,
      transaction_count: monthMetrics.transaction_count || 0,
      pending_amount: monthMetrics.pending_amount || 0
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Filtro de Ano para Cards */}
      <Card className="bg-white border-gray-300">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-white border-gray-300">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">Dados anuais dos cards abaixo</span>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo Anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Receita Total Anual */}
        <Card className="bg-white border-gray-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
              Receita Total {selectedYear}
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">
              R$ {(yearlyMetrics?.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Contas a Receber
            </p>
          </CardContent>
        </Card>

        {/* Despesas Totais Anual (SEM comissões) */}
        <Card className="bg-white border-gray-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
              Despesas Totais {selectedYear}
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-700">
              R$ {(yearlyMetrics?.total_expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Contas a Pagar (inclui comissões)
            </p>
          </CardContent>
        </Card>

        {/* Comissões Anual */}
        <Card className="bg-white border-gray-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
              Comissões {selectedYear}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-700">
              R$ {(yearlyMetrics?.total_commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Contas a Pagar (comissões)
            </p>
          </CardContent>
        </Card>

        {/* Lucro Líquido Anual */}
        <Card className="bg-white border-gray-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
              Lucro Líquido {selectedYear}
            </CardTitle>
            <Calculator className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${
              (yearlyMetrics?.net_profit || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
            }`}>
              R$ {(yearlyMetrics?.net_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Receita - Despesas Totais
            </p>
          </CardContent>
        </Card>
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
