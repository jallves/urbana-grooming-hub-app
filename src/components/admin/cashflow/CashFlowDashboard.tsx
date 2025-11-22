import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashFlowChart from './CashFlowChart';
import RevenueChart from './RevenueChart';
import ExpenseChart from './ExpenseChart';
import TopBarbersChart from './TopBarbersChart';
import DailyCashFlow from './DailyCashFlow';
import { getCategoryLabel } from '@/utils/categoryMappings';
import { translateDescription } from '@/utils/translationHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtime } from '@/contexts/RealtimeContext';

const CashFlowDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    queryClient.invalidateQueries({ queryKey: ['last-month-data'] });
  }, [refreshFinancials, queryClient]);

  // Calcular datas baseadas no ano e mês selecionados
  const getPeriodDates = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1; // 0-indexed
    const daysInMonth = getDaysInMonth(new Date(year, month));
    
    return {
      start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      end: `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    };
  };

  const periodDates = getPeriodDates();

  // Gerar lista de anos (2025 até 2035 - 10 anos)
  const years = Array.from({ length: 11 }, (_, i) => (2025 + i).toString());
  
  // Meses em português
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const { data: currentMonthData, isLoading } = useQuery({
    queryKey: ['cash-flow-current-month'],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // 💰 Buscar de financial_records (tabela correta do ERP)
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const { data: lastMonthData } = useQuery({
    queryKey: ['cash-flow-last-month'],
    queryFn: async () => {
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      
      // 💰 Buscar de financial_records (tabela correta do ERP)
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar dados financeiros do mês anterior:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // 💰 Calcular valores usando financial_records (transaction_type: revenue, expense, commission)
  const currentIncome = currentMonthData?.filter(t => 
    t.transaction_type === 'revenue' && t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const currentExpense = currentMonthData?.filter(t => 
    (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
    t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const currentNet = currentIncome - currentExpense;

  const lastIncome = lastMonthData?.filter(t => 
    t.transaction_type === 'revenue' && t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const lastExpense = lastMonthData?.filter(t => 
    (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
    t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
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
      {/* Filtro de Período - Ano e Mês */}
      <Card className="bg-white border-gray-300">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <div className="flex gap-2 flex-1 flex-wrap">
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
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Caixa do Dia - NOVO */}
      <DailyCashFlow />

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

      {/* Gráfico de Fluxo 6 Meses - Full Width */}
      <Card className="bg-white border-gray-300">
        <CardHeader className="p-2 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-base lg:text-lg text-black">
            Fluxo de Caixa - Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
          <div className="h-[180px] sm:h-[250px] lg:h-[300px] -mx-2 sm:mx-0">
            <CashFlowChart />
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Categoria - Grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white border-gray-300">
          <CardHeader className="p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-base lg:text-lg text-black">
              Receitas por Categoria
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Todas as receitas do Contas a Receber</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="h-[180px] sm:h-[250px] lg:h-[300px] -mx-2 sm:mx-0">
              <RevenueChart startDate={periodDates.start} endDate={periodDates.end} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300">
          <CardHeader className="p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-base lg:text-lg text-black">
              Despesas por Categoria
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Despesas do Contas a Pagar</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="h-[180px] sm:h-[250px] lg:h-[300px] -mx-2 sm:mx-0">
              <ExpenseChart startDate={periodDates.start} endDate={periodDates.end} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300">
          <CardHeader className="p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-base lg:text-lg text-black">
              Top 5 Barbeiros
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Receita gerada no período</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="h-[180px] sm:h-[250px] lg:h-[300px] -mx-2 sm:mx-0">
              <TopBarbersChart startDate={periodDates.start} endDate={periodDates.end} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes - Otimizado para mobile */}
      <Card className="bg-white border-gray-300">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-black flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Transações Recentes - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {currentMonthData && currentMonthData.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {currentMonthData.slice(0, 5).map((transaction) => {
                const isRevenue = transaction.transaction_type === 'revenue';
                const isExpense = transaction.transaction_type === 'expense' || transaction.transaction_type === 'commission';
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${isRevenue ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-black text-xs sm:text-sm truncate">
                            {translateDescription(transaction.description)}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {getCategoryLabel(transaction.category)}
                            {transaction.subcategory && ` • ${getCategoryLabel(transaction.subcategory)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-semibold text-xs sm:text-sm ${isRevenue ? 'text-green-600' : 'text-red-600'}`}>
                        {isRevenue ? '+' : '-'}R$ {Number(transaction.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(parseISO(transaction.transaction_date), "dd/MM/yy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
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
