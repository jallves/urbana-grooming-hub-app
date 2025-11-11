
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
        
        // 💰 Buscar de financial_records (tabela correta do ERP)
        const { data, error } = await supabase
          .from('financial_records')
          .select('*')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        if (error) {
          console.error('Erro ao buscar relatório mensal:', error);
          throw error;
        }

        // Receitas = revenue completed
        const income = data?.filter(t => 
          t.transaction_type === 'revenue' && t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
        
        // Despesas = expense + commission completed
        const expense = data?.filter(t => 
          (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
          t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

        months.push({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          income,
          expense,
          net: income - expense,
        });
      }

      return months;
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const { data: yearlyData } = useQuery({
    queryKey: ['cash-flow-yearly-report'],
    queryFn: async () => {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      
      // 💰 Buscar de financial_records (tabela correta do ERP)
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar relatório anual:', error);
        throw error;
      }

      // Receitas = revenue completed
      const totalIncome = data?.filter(t => 
        t.transaction_type === 'revenue' && t.status === 'completed'
      ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
      
      // Despesas = expense + commission completed
      const totalExpense = data?.filter(t => 
        (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
        t.status === 'completed'
      ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
      
      // Agrupar por categoria
      const categories: Record<string, { income: number; expense: number }> = {};
      data?.forEach(transaction => {
        if (transaction.status !== 'completed') return;
        
        if (!categories[transaction.category]) {
          categories[transaction.category] = { income: 0, expense: 0 };
        }
        if (transaction.transaction_type === 'revenue') {
          categories[transaction.category].income += Number(transaction.net_amount);
        } else if (transaction.transaction_type === 'expense' || transaction.transaction_type === 'commission') {
          categories[transaction.category].expense += Number(transaction.net_amount);
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
    refetchInterval: 10000, // Atualizar a cada 10 segundos
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
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-green-700">
              Receita Anual
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-green-700">
              R$ {(yearlyData?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {yearlyData?.transactionCount || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-red-700">
              Despesa Anual
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-red-700">
              R$ {(yearlyData?.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-yellow-700">
              Lucro Anual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-yellow-700">
              R$ {(yearlyData?.totalNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs mt-1 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-blue-700">
              Mês Atual
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-blue-700">
              R$ {(currentMonthData?.net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance - Horizontal Scroll on Mobile */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Mensal (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {monthlyData?.map((month, index) => (
                <div key={index} className="flex-shrink-0 w-24 text-center">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-900">{month.month}</div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-700">
                        +{(month.income / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-red-700">
                        -{(month.expense / 1000).toFixed(0)}k
                      </div>
                      <div className={`text-xs font-bold ${month.net >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
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
      <Card className="bg-white border-gray-200">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Resumo por Categoria (Ano Atual)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {yearlyData?.categories && Object.entries(yearlyData.categories).map(([category, data]) => (
              <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-sm text-gray-900 truncate font-medium">{category}</span>
                <div className="text-right">
                  <div className="text-xs text-green-700 font-semibold">
                    +R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-red-700 font-semibold">
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
