import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart, Download, Users, Scissors, ShoppingBag, Percent, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryLabel } from '@/utils/categoryMappings';
import * as XLSX from 'xlsx';

const CashFlowReports: React.FC = () => {
  const currentDate = new Date();
  const currentMonth = startOfMonth(currentDate);
  const currentYear = startOfYear(currentDate);

  // Dados mensais dos últimos 12 meses
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['cash-flow-monthly-report'],
    queryFn: async () => {
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const { data, error } = await supabase
          .from('financial_records')
          .select('*')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        if (error) {
          console.error('Erro ao buscar relatório mensal:', error);
          throw error;
        }

        const income = data?.filter(t => 
          t.transaction_type === 'revenue' && t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
        
        const expense = data?.filter(t => 
          (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
          t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

        const serviceCount = data?.filter(t => 
          t.transaction_type === 'revenue' && t.category === 'servico' && t.status === 'completed'
        ).length || 0;

        months.push({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          monthFull: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
          income,
          expense,
          net: income - expense,
          serviceCount,
          avgTicket: serviceCount > 0 ? income / serviceCount : 0,
        });
      }

      return months;
    },
    refetchInterval: 10000,
  });

  // Dados anuais consolidados
  const { data: yearlyData } = useQuery({
    queryKey: ['cash-flow-yearly-report'],
    queryFn: async () => {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar relatório anual:', error);
        throw error;
      }

      const totalIncome = data?.filter(t => 
        t.transaction_type === 'revenue' && t.status === 'completed'
      ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
      
      const totalExpense = data?.filter(t => 
        (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
        t.status === 'completed'
      ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
      
      // Agrupar por categoria
      const categories: Record<string, { income: number; expense: number; count: number }> = {};
      data?.forEach(transaction => {
        if (transaction.status !== 'completed') return;
        
        const cat = transaction.category || 'outros';
        if (!categories[cat]) {
          categories[cat] = { income: 0, expense: 0, count: 0 };
        }
        categories[cat].count++;
        if (transaction.transaction_type === 'revenue') {
          categories[cat].income += Number(transaction.net_amount);
        } else if (transaction.transaction_type === 'expense' || transaction.transaction_type === 'commission') {
          categories[cat].expense += Number(transaction.net_amount);
        }
      });

      // Métricas de serviços
      const services = data?.filter(t => 
        t.transaction_type === 'revenue' && t.category === 'servico' && t.status === 'completed'
      ) || [];
      
      const products = data?.filter(t => 
        t.transaction_type === 'revenue' && (t.category === 'produto' || t.category === 'produtos') && t.status === 'completed'
      ) || [];

      const tips = data?.filter(t => 
        t.transaction_type === 'revenue' && (t.category === 'gorjeta' || t.category === 'tips') && t.status === 'completed'
      ) || [];

      const commissions = data?.filter(t => 
        t.transaction_type === 'commission' && t.status === 'completed'
      ) || [];

      // Top barbeiros
      const barberRevenue: Record<string, { name: string; revenue: number; services: number }> = {};
      services.forEach(s => {
        const barberId = s.barber_id || 'unknown';
        const barberName = s.barber_name || 'Desconhecido';
        if (!barberRevenue[barberId]) {
          barberRevenue[barberId] = { name: barberName, revenue: 0, services: 0 };
        }
        barberRevenue[barberId].revenue += Number(s.net_amount);
        barberRevenue[barberId].services++;
      });

      const topBarbers = Object.values(barberRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalIncome,
        totalExpense,
        totalNet: totalIncome - totalExpense,
        categories,
        transactionCount: data?.length || 0,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
        serviceCount: services.length,
        productCount: products.length,
        avgTicket: services.length > 0 ? services.reduce((sum, s) => sum + Number(s.net_amount), 0) / services.length : 0,
        totalTips: tips.reduce((sum, t) => sum + Number(t.net_amount), 0),
        totalCommissions: Math.abs(commissions.reduce((sum, c) => sum + Number(c.net_amount), 0)),
        topBarbers,
        productRevenue: products.reduce((sum, p) => sum + Number(p.net_amount), 0),
        serviceRevenue: services.reduce((sum, s) => sum + Number(s.net_amount), 0),
      };
    },
    refetchInterval: 10000,
  });

  // Exportar para Excel
  const exportToExcel = () => {
    if (!monthlyData || !yearlyData) return;

    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Executivo
    const summaryData = [
      ['RELATÓRIO FINANCEIRO - RESUMO EXECUTIVO'],
      ['Período:', `${format(startOfYear(currentDate), 'dd/MM/yyyy')} a ${format(currentDate, 'dd/MM/yyyy')}`],
      [''],
      ['INDICADORES PRINCIPAIS'],
      ['Receita Total', yearlyData.totalIncome],
      ['Despesa Total', yearlyData.totalExpense],
      ['Lucro Líquido', yearlyData.totalNet],
      ['Margem de Lucro', `${yearlyData.profitMargin.toFixed(1)}%`],
      [''],
      ['MÉTRICAS OPERACIONAIS'],
      ['Total de Serviços', yearlyData.serviceCount],
      ['Total de Produtos Vendidos', yearlyData.productCount],
      ['Ticket Médio', yearlyData.avgTicket],
      ['Total de Gorjetas', yearlyData.totalTips],
      ['Total de Comissões', yearlyData.totalCommissions],
      [''],
      ['DISTRIBUIÇÃO DE RECEITA'],
      ['Serviços', yearlyData.serviceRevenue],
      ['Produtos', yearlyData.productRevenue],
      ['Gorjetas', yearlyData.totalTips],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

    // Aba 2: Performance Mensal
    const monthlySheetData = [
      ['Mês', 'Receita', 'Despesa', 'Lucro', 'Serviços', 'Ticket Médio'],
      ...monthlyData.map(m => [
        m.monthFull,
        m.income,
        m.expense,
        m.net,
        m.serviceCount,
        m.avgTicket
      ])
    ];
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlySheetData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Performance Mensal');

    // Aba 3: Análise por Categoria
    const categoryData = [
      ['Categoria', 'Receita', 'Despesa', 'Transações'],
      ...Object.entries(yearlyData.categories).map(([cat, data]) => [
        getCategoryLabel(cat),
        data.income,
        data.expense,
        data.count
      ])
    ];
    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Análise por Categoria');

    // Aba 4: Top Barbeiros
    const barberData = [
      ['Posição', 'Barbeiro', 'Receita Gerada', 'Serviços Realizados', 'Ticket Médio'],
      ...yearlyData.topBarbers.map((b, idx) => [
        `${idx + 1}º`,
        b.name,
        b.revenue,
        b.services,
        b.services > 0 ? b.revenue / b.services : 0
      ])
    ];
    const wsBarbers = XLSX.utils.aoa_to_sheet(barberData);
    XLSX.utils.book_append_sheet(wb, wsBarbers, 'Top Barbeiros');

    // Download
    const fileName = `relatorio_financeiro_${format(currentDate, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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

  const revenueGrowth = lastMonthData?.income !== 0
    ? ((currentMonthData?.income || 0) - (lastMonthData?.income || 0)) / Math.abs(lastMonthData?.income || 1) * 100
    : 0;

  return (
    <div className="h-full space-y-4 overflow-auto">
      {/* Header com Botão de Exportar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Relatórios Gerenciais</h2>
          <p className="text-xs text-gray-500">Análise completa para tomada de decisões</p>
        </div>
        <Button 
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-green-700">Receita Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base lg:text-lg font-bold text-green-700">
              R$ {(yearlyData?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className={`text-xs mt-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-red-700">Despesa Anual</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base lg:text-lg font-bold text-red-700">
              R$ {(yearlyData?.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {yearlyData?.transactionCount || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-amber-700">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-base lg:text-lg font-bold ${(yearlyData?.totalNet || 0) >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
              R$ {(yearlyData?.totalNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className={`text-xs mt-1 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(monthlyGrowth).toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-blue-700">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-base lg:text-lg font-bold ${(yearlyData?.profitMargin || 0) >= 20 ? 'text-green-700' : (yearlyData?.profitMargin || 0) >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
              {(yearlyData?.profitMargin || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {(yearlyData?.profitMargin || 0) >= 20 ? '✓ Saudável' : (yearlyData?.profitMargin || 0) >= 10 ? '⚠ Atenção' : '⚠ Crítico'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Operacionais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scissors className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Serviços</p>
                <p className="text-sm font-bold text-gray-900">{yearlyData?.serviceCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Produtos</p>
                <p className="text-sm font-bold text-gray-900">{yearlyData?.productCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ticket Médio</p>
                <p className="text-sm font-bold text-gray-900">R$ {(yearlyData?.avgTicket || 0).toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gorjetas</p>
                <p className="text-sm font-bold text-gray-900">R$ {(yearlyData?.totalTips || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Comissões</p>
                <p className="text-sm font-bold text-gray-900">R$ {(yearlyData?.totalCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Mensal e Top Barbeiros lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Mensal */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Evolução Mensal (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {monthlyData?.slice(-6).map((month, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
                  <div className="text-xs font-semibold text-gray-900 text-center">{month.month}</div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-green-700 text-center font-medium">
                      +R$ {(month.income / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[10px] text-red-700 text-center font-medium">
                      -R$ {(month.expense / 1000).toFixed(0)}k
                    </div>
                    <div className={`text-[10px] font-bold text-center ${month.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      = R$ {(month.net / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-500 text-center">
                    {month.serviceCount} serviços
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Barbeiros */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top 5 Barbeiros (Ano)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {yearlyData?.topBarbers && yearlyData.topBarbers.length > 0 ? (
                yearlyData.topBarbers.map((barber, index) => {
                  const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-red-100 text-red-700'];
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${colors[index]}`}>
                          {index + 1}º
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{barber.name}</p>
                          <p className="text-xs text-gray-500">{barber.services} serviços</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          R$ {barber.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ticket: R$ {barber.services > 0 ? (barber.revenue / barber.services).toFixed(0) : 0}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categoria */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Análise por Categoria (Ano Atual)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {yearlyData?.categories && Object.entries(yearlyData.categories)
              .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
              .map(([category, data]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getCategoryLabel(category)}</p>
                    <p className="text-xs text-gray-500">{data.count} transações</p>
                  </div>
                  <div className="text-right">
                    {data.income > 0 && (
                      <div className="text-xs text-green-700 font-semibold">
                        +R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                    {data.expense > 0 && (
                      <div className="text-xs text-red-700 font-semibold">
                        -R$ {data.expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Saúde Financeira */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Indicadores de Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Margem de Lucro */}
            <div className={`p-3 rounded-lg border ${(yearlyData?.profitMargin || 0) >= 20 ? 'bg-green-50 border-green-200' : (yearlyData?.profitMargin || 0) >= 10 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {(yearlyData?.profitMargin || 0) >= 20 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-xs font-medium text-gray-700">Margem de Lucro</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{(yearlyData?.profitMargin || 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {(yearlyData?.profitMargin || 0) >= 20 
                  ? 'Excelente! Margem acima de 20%' 
                  : (yearlyData?.profitMargin || 0) >= 10 
                  ? 'Atenção: Margem entre 10-20%' 
                  : 'Crítico: Margem abaixo de 10%'}
              </p>
            </div>

            {/* Ratio Despesa/Receita */}
            <div className={`p-3 rounded-lg border ${yearlyData && yearlyData.totalIncome > 0 && (yearlyData.totalExpense / yearlyData.totalIncome) <= 0.7 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Ratio Despesa/Receita</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {yearlyData && yearlyData.totalIncome > 0 
                  ? ((yearlyData.totalExpense / yearlyData.totalIncome) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Ideal: abaixo de 70%
              </p>
            </div>

            {/* Crescimento Mensal */}
            <div className={`p-3 rounded-lg border ${monthlyGrowth >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {monthlyGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs font-medium text-gray-700">Crescimento Mensal</span>
              </div>
              <p className={`text-lg font-bold ${monthlyGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Comparado ao mês anterior
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowReports;