
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashFlowReports: React.FC = () => {
  const currentDate = new Date();
  const currentMonth = startOfMonth(currentDate);
  const currentYear = startOfYear(currentDate);

  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['cash-flow-monthly-report'],
    queryFn: async () => {
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const { data, error } = await supabase
          .from('cash_flow')
          .select('*')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        if (error) throw error;

        const income = data?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const expense = data?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        months.push({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          income,
          expense,
          net: income - expense,
        });
      }

      return months;
    },
  });

  const { data: yearlyData } = useQuery({
    queryKey: ['cash-flow-yearly-report'],
    queryFn: async () => {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalIncome = data?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpense = data?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Group by category
      const categories: Record<string, { income: number; expense: number }> = {};
      data?.forEach(transaction => {
        if (!categories[transaction.category]) {
          categories[transaction.category] = { income: 0, expense: 0 };
        }
        if (transaction.transaction_type === 'income') {
          categories[transaction.category].income += Number(transaction.amount);
        } else {
          categories[transaction.category].expense += Number(transaction.amount);
        }
      });

      return {
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
        categories,
        transactionCount: data?.length || 0,
      };
    },
  });

  if (loadingMonthly) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando relatórios...</div>
      </div>
    );
  }

  const currentMonthData = monthlyData?.[monthlyData.length - 1];
  const lastMonthData = monthlyData?.[monthlyData.length - 2];

  const monthlyGrowth = lastMonthData?.net !== 0 
    ? ((currentMonthData?.net || 0) - (lastMonthData?.net || 0)) / Math.abs(lastMonthData?.net || 1) * 100 
    : 0;

  return (
    <div className="h-full space-y-4 overflow-auto">
      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-green-400">
              Receita Anual
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-green-400">
              R$ {(yearlyData?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-400/70 mt-1">
              {yearlyData?.transactionCount || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-red-400">
              Despesa Anual
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-red-400">
              R$ {(yearlyData?.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-400/70 mt-1">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-urbana-gold/30 to-yellow-800/20 border-urbana-gold/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-urbana-gold">
              Lucro Anual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-urbana-gold" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-urbana-gold">
              R$ {(yearlyData?.totalNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs mt-1 ${monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-blue-400">
              Mês Atual
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-blue-400">
              R$ {(currentMonthData?.net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-blue-400/70 mt-1">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance - Horizontal Scroll on Mobile */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Mensal (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {monthlyData?.map((month, index) => (
                <div key={index} className="flex-shrink-0 w-24 text-center">
                  <div className="bg-gray-800/50 rounded-lg p-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-300">{month.month}</div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-400">
                        +{(month.income / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-red-400">
                        -{(month.expense / 1000).toFixed(0)}k
                      </div>
                      <div className={`text-xs font-bold ${month.net >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>
                        {month.net >= 0 ? '+' : ''}{(month.net / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Breakdown */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Resumo por Categoria (Ano Atual)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {yearlyData?.categories && Object.entries(yearlyData.categories).map(([category, data]) => (
              <div key={category} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-sm text-gray-300 truncate">{category}</span>
                <div className="text-right">
                  <div className="text-xs text-green-400">
                    +R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-red-400">
                    -R$ {data.expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowReports;
