import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashFlowChart from './CashFlowChart';
import CategoryChart from './CategoryChart';

const CashFlowDashboard: React.FC = () => {
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);

  const { data: currentMonthData, isLoading } = useQuery({
    queryKey: ['cash-flow-current-month'],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;
      return data || [];
    },
  });

  const { data: lastMonthData } = useQuery({
    queryKey: ['cash-flow-last-month'],
    queryFn: async () => {
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;
      return data || [];
    },
  });

  const currentIncome = currentMonthData?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const currentExpense = currentMonthData?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const currentNet = currentIncome - currentExpense;

  const lastIncome = lastMonthData?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const lastExpense = lastMonthData?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const lastNet = lastIncome - lastExpense;

  const incomeGrowth = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
  const expenseGrowth = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;
  const netGrowth = lastNet !== 0 ? ((currentNet - lastNet) / Math.abs(lastNet)) * 100 : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border-gray-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full">
      {/* Métricas principais - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-black">
              Receitas
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              R$ {currentIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {incomeGrowth >= 0 ? '+' : ''}{incomeGrowth.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-black">
              Despesas
            </CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
              R$ {currentExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-black">
              Saldo Líquido
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${currentNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {currentNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netGrowth >= 0 ? '+' : ''}{netGrowth.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos - Stack em mobile, side-by-side em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white border-gray-300">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-black">
              Fluxo - 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
              <CashFlowChart />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-black">
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
              <CategoryChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações recentes - Otimizado para mobile */}
      <Card className="bg-white border-gray-300">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-black flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {currentMonthData && currentMonthData.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {currentMonthData.slice(-5).reverse().map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${transaction.transaction_type === 'income' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-black text-xs sm:text-sm truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-semibold text-xs sm:text-sm ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(parseISO(transaction.transaction_date + 'T00:00:00'), "dd/MM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600 text-sm">Nenhuma transação encontrada este mês</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowDashboard;
