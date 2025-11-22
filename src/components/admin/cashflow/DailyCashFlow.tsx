import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useRealtime } from '@/contexts/RealtimeContext';

const DailyCashFlow: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['daily-cash-flow'] });
  }, [refreshFinancials, queryClient]);

  const { data: dailyData, isLoading } = useQuery({
    queryKey: ['daily-cash-flow', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_date', today)
        .eq('status', 'completed'); // Apenas transações PAGAS

      if (error) {
        console.error('Erro ao buscar fluxo de caixa do dia:', error);
        throw error;
      }

      // Calcular receitas do dia (apenas completed)
      const dailyRevenue = data
        ?.filter(t => t.transaction_type === 'revenue')
        .reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

      // Calcular despesas do dia (apenas completed/pagas)
      const dailyExpense = data
        ?.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'commission')
        .reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

      // Saldo do dia
      const dailyBalance = dailyRevenue - dailyExpense;

      return {
        revenue: dailyRevenue,
        expense: dailyExpense,
        balance: dailyBalance,
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border-gray-300">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Receita do Dia */}
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
            Receita do Dia
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-700" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">
            R$ {dailyData?.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Apenas valores recebidos hoje
          </p>
        </CardContent>
      </Card>

      {/* Despesa do Dia */}
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
            Despesa do Dia
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-700" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-red-700">
            R$ {dailyData?.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Apenas despesas pagas hoje
          </p>
        </CardContent>
      </Card>

      {/* Saldo do Dia */}
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
            Saldo do Dia
          </CardTitle>
          <Wallet className="h-4 w-4 text-blue-700" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className={`text-xl sm:text-2xl font-bold ${
            (dailyData?.balance || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            R$ {dailyData?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Receita - Despesas pagas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCashFlow;
