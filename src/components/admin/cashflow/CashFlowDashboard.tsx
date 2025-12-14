import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Landmark } from 'lucide-react';
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

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    queryClient.invalidateQueries({ queryKey: ['selected-month-data'] });
    queryClient.invalidateQueries({ queryKey: ['total-balance'] });
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

  // Buscar dados do MÊS SELECIONADO
  const { data: selectedMonthData, isLoading } = useQuery({
    queryKey: ['selected-month-data', periodDates.start, periodDates.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', periodDates.start)
        .lte('transaction_date', periodDates.end)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Buscar SALDO TOTAL (tudo que entrou - tudo que saiu desde o início)
  const { data: totalBalanceData } = useQuery({
    queryKey: ['total-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('transaction_type, net_amount, status')
        .eq('status', 'completed');

      if (error) {
        console.error('Erro ao buscar saldo total:', error);
        throw error;
      }

      // Calcular total de receitas
      const totalRevenue = data
        ?.filter(t => t.transaction_type === 'revenue')
        .reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

      // Calcular total de despesas
      const totalExpense = data
        ?.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'commission')
        .reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

      return {
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense
      };
    },
    refetchInterval: 10000,
  });

  // Buscar dados do mês anterior ao selecionado para comparação
  const previousMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 2, 1);
  const prevMonthStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
  const prevMonthEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd');

  const { data: previousMonthData } = useQuery({
    queryKey: ['previous-month-data', prevMonthStart, prevMonthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', prevMonthStart)
        .lte('transaction_date', prevMonthEnd);

      if (error) {
        console.error('Erro ao buscar dados do mês anterior:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Calcular valores do MÊS SELECIONADO
  const selectedIncome = selectedMonthData?.filter(t => 
    t.transaction_type === 'revenue' && t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const selectedExpense = selectedMonthData?.filter(t => 
    (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
    t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const selectedNet = selectedIncome - selectedExpense;

  // Calcular valores do mês anterior para comparação
  const previousIncome = previousMonthData?.filter(t => 
    t.transaction_type === 'revenue' && t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const previousExpense = previousMonthData?.filter(t => 
    (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
    t.status === 'completed'
  ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
  
  const previousNet = previousIncome - previousExpense;

  const incomeGrowth = previousIncome > 0 ? ((selectedIncome - previousIncome) / previousIncome) * 100 : 0;
  const expenseGrowth = previousExpense > 0 ? ((selectedExpense - previousExpense) / previousExpense) * 100 : 0;
  const netGrowth = previousNet !== 0 ? ((selectedNet - previousNet) / Math.abs(previousNet)) * 100 : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
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

      {/* Métricas do Mês Selecionado + Saldo Bancário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-black">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              R$ {selectedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
              R$ {selectedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-black">
              Saldo do Mês
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${selectedNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {selectedNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netGrowth >= 0 ? '+' : ''}{netGrowth.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Bancário - Saldo Geral da Empresa */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Saldo Bancário
            </CardTitle>
            <Landmark className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${(totalBalanceData?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {(totalBalanceData?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Saldo total para conciliação
            </p>
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
          {selectedMonthData && selectedMonthData.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {selectedMonthData.slice(0, 5).map((transaction) => {
                const isRevenue = transaction.transaction_type === 'revenue';
                
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
              <p className="text-gray-600 text-sm">Nenhuma transação encontrada neste mês</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowDashboard;
