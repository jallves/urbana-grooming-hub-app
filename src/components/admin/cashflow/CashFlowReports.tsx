import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart, Download, Users, Scissors, ShoppingBag, Percent, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
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

  // Dados detalhados de comissões por barbeiro
  const { data: barberCommissionDetails } = useQuery({
    queryKey: ['barber-commission-details-report'],
    queryFn: async () => {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);

      const { data, error } = await supabase
        .from('barber_commissions')
        .select('*, painel_barbeiros:barber_id(nome)')
        .gte('created_at', format(start, 'yyyy-MM-dd') + 'T00:00:00')
        .lte('created_at', format(end, 'yyyy-MM-dd') + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Dados detalhados de contas a pagar
  const { data: contasPagarData } = useQuery({
    queryKey: ['contas-pagar-report-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Dados detalhados de contas a receber
  const { data: contasReceberData } = useQuery({
    queryKey: ['contas-receber-report-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const fmtDate = (d: string | null) => {
    if (!d) return '-';
    try { return format(parseISO(d), 'dd/MM/yyyy'); } catch { return d; }
  };

  const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Exportar para Excel - COMPLETO
  const exportToExcel = () => {
    if (!monthlyData || !yearlyData) return;

    const wb = XLSX.utils.book_new();

    // === ABA 1: RESUMO EXECUTIVO ===
    const summaryData = [
      ['RELATÓRIO GERENCIAL - BARBEARIA COSTA URBANA'],
      ['Gerado em:', format(currentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      ['Período:', `${format(startOfYear(currentDate), 'dd/MM/yyyy')} a ${format(currentDate, 'dd/MM/yyyy')}`],
      [''],
      ['═══════════════════════════════════════'],
      ['INDICADORES FINANCEIROS PRINCIPAIS'],
      ['═══════════════════════════════════════'],
      ['Receita Total', yearlyData.totalIncome],
      ['Despesa Total', yearlyData.totalExpense],
      ['Comissões Pagas', yearlyData.totalCommissions],
      ['Lucro Líquido', yearlyData.totalNet],
      ['Margem de Lucro', `${yearlyData.profitMargin.toFixed(1)}%`],
      ['Ratio Despesa/Receita', yearlyData.totalIncome > 0 ? `${((yearlyData.totalExpense / yearlyData.totalIncome) * 100).toFixed(1)}%` : '0%'],
      [''],
      ['═══════════════════════════════════════'],
      ['MÉTRICAS OPERACIONAIS'],
      ['═══════════════════════════════════════'],
      ['Total de Serviços Realizados', yearlyData.serviceCount],
      ['Total de Produtos Vendidos', yearlyData.productCount],
      ['Ticket Médio (Serviços)', yearlyData.avgTicket],
      ['Total de Gorjetas', yearlyData.totalTips],
      [''],
      ['═══════════════════════════════════════'],
      ['DISTRIBUIÇÃO DE RECEITA'],
      ['═══════════════════════════════════════'],
      ['Receita de Serviços', yearlyData.serviceRevenue],
      ['Receita de Produtos', yearlyData.productRevenue],
      ['Gorjetas', yearlyData.totalTips],
      [''],
      ['═══════════════════════════════════════'],
      ['SAÚDE FINANCEIRA'],
      ['═══════════════════════════════════════'],
      ['Status da Margem', yearlyData.profitMargin >= 20 ? '✅ Excelente (>20%)' : yearlyData.profitMargin >= 10 ? '⚠️ Atenção (10-20%)' : '🔴 Crítico (<10%)'],
      ['Crescimento Mensal', `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%`],
      ['Crescimento Receita', `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

    // === ABA 2: PERFORMANCE MENSAL ===
    const monthlySheetData = [
      ['PERFORMANCE MENSAL - ÚLTIMOS 12 MESES'],
      [''],
      ['Mês', 'Receita (R$)', 'Despesa (R$)', 'Lucro (R$)', 'Margem %', 'Serviços', 'Ticket Médio (R$)'],
      ...monthlyData.map(m => [
        m.monthFull,
        m.income,
        m.expense,
        m.net,
        m.income > 0 ? `${((m.net / m.income) * 100).toFixed(1)}%` : '0%',
        m.serviceCount,
        m.avgTicket,
      ]),
      [''],
      ['TOTAIS', 
        monthlyData.reduce((s, m) => s + m.income, 0),
        monthlyData.reduce((s, m) => s + m.expense, 0),
        monthlyData.reduce((s, m) => s + m.net, 0),
        '',
        monthlyData.reduce((s, m) => s + m.serviceCount, 0),
        '',
      ],
    ];
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlySheetData);
    wsMonthly['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Performance Mensal');

    // === ABA 3: ANÁLISE POR CATEGORIA ===
    const catEntries = Object.entries(yearlyData.categories);
    const totalCatIncome = catEntries.reduce((s, [, d]) => s + d.income, 0);
    const totalCatExpense = catEntries.reduce((s, [, d]) => s + d.expense, 0);
    const categorySheetData = [
      ['ANÁLISE POR CATEGORIA'],
      [''],
      ['Categoria', 'Receita (R$)', '% da Receita', 'Despesa (R$)', '% da Despesa', 'Saldo (R$)', 'Transações'],
      ...catEntries.map(([cat, data]) => [
        getCategoryLabel(cat),
        data.income,
        totalCatIncome > 0 ? `${((data.income / totalCatIncome) * 100).toFixed(1)}%` : '0%',
        data.expense,
        totalCatExpense > 0 ? `${((data.expense / totalCatExpense) * 100).toFixed(1)}%` : '0%',
        data.income - data.expense,
        data.count,
      ]),
      [''],
      ['TOTAIS', totalCatIncome, '100%', totalCatExpense, '100%', totalCatIncome - totalCatExpense, catEntries.reduce((s, [, d]) => s + d.count, 0)],
    ];
    const wsCategory = XLSX.utils.aoa_to_sheet(categorySheetData);
    wsCategory['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Análise por Categoria');

    // === ABA 4: RANKING DE BARBEIROS ===
    const barberSheetData = [
      ['RANKING DE BARBEIROS - RECEITA GERADA'],
      [''],
      ['Posição', 'Barbeiro', 'Receita Gerada (R$)', 'Serviços', 'Ticket Médio (R$)', '% da Receita Total'],
      ...yearlyData.topBarbers.map((b, idx) => [
        `${idx + 1}º`,
        b.name,
        b.revenue,
        b.services,
        b.services > 0 ? b.revenue / b.services : 0,
        yearlyData.serviceRevenue > 0 ? `${((b.revenue / yearlyData.serviceRevenue) * 100).toFixed(1)}%` : '0%',
      ]),
    ];
    const wsBarbers = XLSX.utils.aoa_to_sheet(barberSheetData);
    wsBarbers['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsBarbers, 'Ranking Barbeiros');

    // === ABA 5: COMISSÕES DETALHADAS ===
    if (barberCommissionDetails && barberCommissionDetails.length > 0) {
      // Agrupar por barbeiro
      const byBarber: Record<string, { nome: string; items: typeof barberCommissionDetails; total: number; totalPago: number; totalPendente: number }> = {};
      barberCommissionDetails.forEach(c => {
        const nome = (c as any).painel_barbeiros?.nome || c.barber_name || 'Desconhecido';
        if (!byBarber[nome]) byBarber[nome] = { nome, items: [], total: 0, totalPago: 0, totalPendente: 0 };
        byBarber[nome].items.push(c);
        const val = Number(c.valor || c.amount || 0);
        byBarber[nome].total += val;
        if (c.status === 'pago' || c.status === 'paid') byBarber[nome].totalPago += val;
        else byBarber[nome].totalPendente += val;
      });

      const commSheetData: any[][] = [
        ['RELATÓRIO DE COMISSÕES POR BARBEIRO'],
        [''],
      ];

      Object.values(byBarber).sort((a, b) => b.total - a.total).forEach(barber => {
        commSheetData.push(['']);
        commSheetData.push([`═══ ${barber.nome.toUpperCase()} ═══`]);
        commSheetData.push(['Total Comissões:', barber.total]);
        commSheetData.push(['Pagas:', barber.totalPago]);
        commSheetData.push(['Pendentes:', barber.totalPendente]);
        commSheetData.push(['']);
        commSheetData.push(['Data', 'Valor (R$)', 'Status', 'Tipo', 'Fonte']);
        barber.items.forEach(c => {
          commSheetData.push([
            fmtDate(c.created_at),
            Number(c.valor || c.amount || 0),
            c.status === 'pago' || c.status === 'paid' ? 'Pago' : 'Pendente',
            c.tipo || '-',
            c.appointment_source || '-',
          ]);
        });
      });

      // Resumo geral no final
      commSheetData.push(['']);
      commSheetData.push(['═══════════════════════════════════════']);
      commSheetData.push(['RESUMO GERAL DE COMISSÕES']);
      commSheetData.push(['Barbeiro', 'Total (R$)', 'Pagas (R$)', 'Pendentes (R$)', '% do Total']);
      const grandTotal = Object.values(byBarber).reduce((s, b) => s + b.total, 0);
      Object.values(byBarber).sort((a, b) => b.total - a.total).forEach(b => {
        commSheetData.push([b.nome, b.total, b.totalPago, b.totalPendente, grandTotal > 0 ? `${((b.total / grandTotal) * 100).toFixed(1)}%` : '0%']);
      });
      commSheetData.push(['TOTAL', grandTotal, Object.values(byBarber).reduce((s, b) => s + b.totalPago, 0), Object.values(byBarber).reduce((s, b) => s + b.totalPendente, 0), '100%']);

      const wsComm = XLSX.utils.aoa_to_sheet(commSheetData);
      wsComm['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsComm, 'Comissões Barbeiros');
    }

    // === ABA 6: CONTAS A PAGAR ===
    if (contasPagarData && contasPagarData.length > 0) {
      const totalPagar = contasPagarData.reduce((s, c) => s + Number(c.valor), 0);
      const pagas = contasPagarData.filter(c => c.status === 'pago');
      const pendentes = contasPagarData.filter(c => c.status === 'pendente');
      const vencidas = pendentes.filter(c => new Date(c.data_vencimento) < currentDate);

      const cpData: any[][] = [
        ['RELATÓRIO DE CONTAS A PAGAR'],
        [''],
        ['Total Geral:', totalPagar],
        ['Total Pagas:', pagas.reduce((s, c) => s + Number(c.valor), 0)],
        ['Total Pendentes:', pendentes.reduce((s, c) => s + Number(c.valor), 0)],
        ['Contas Vencidas:', vencidas.length],
        ['Valor Vencido:', vencidas.reduce((s, c) => s + Number(c.valor), 0)],
        [''],
        ['Descrição', 'Fornecedor', 'Categoria', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Status', 'Forma Pgto', 'Observações'],
        ...contasPagarData.map(c => [
          c.descricao,
          c.fornecedor || '-',
          c.categoria || '-',
          Number(c.valor),
          fmtDate(c.data_vencimento),
          fmtDate(c.data_pagamento),
          c.status === 'pago' ? 'Pago' : 'Pendente',
          c.forma_pagamento || '-',
          c.observacoes || '',
        ]),
      ];
      const wsCp = XLSX.utils.aoa_to_sheet(cpData);
      wsCp['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsCp, 'Contas a Pagar');
    }

    // === ABA 7: CONTAS A RECEBER ===
    if (contasReceberData && contasReceberData.length > 0) {
      const totalReceber = contasReceberData.reduce((s, c) => s + Number(c.valor), 0);
      const recebidas = contasReceberData.filter(c => c.status === 'recebido');
      const pendentesR = contasReceberData.filter(c => c.status === 'pendente');
      const vencidasR = pendentesR.filter(c => new Date(c.data_vencimento) < currentDate);

      const crData: any[][] = [
        ['RELATÓRIO DE CONTAS A RECEBER'],
        [''],
        ['Total Geral:', totalReceber],
        ['Total Recebidas:', recebidas.reduce((s, c) => s + Number(c.valor), 0)],
        ['Total Pendentes:', pendentesR.reduce((s, c) => s + Number(c.valor), 0)],
        ['Contas Vencidas:', vencidasR.length],
        ['Valor Vencido:', vencidasR.reduce((s, c) => s + Number(c.valor), 0)],
        [''],
        ['Descrição', 'Categoria', 'Valor (R$)', 'Vencimento', 'Recebimento', 'Status', 'Forma Pgto', 'Observações'],
        ...contasReceberData.map(c => [
          c.descricao,
          c.categoria || '-',
          Number(c.valor),
          fmtDate(c.data_vencimento),
          fmtDate(c.data_recebimento),
          c.status === 'recebido' ? 'Recebido' : 'Pendente',
          c.forma_pagamento || '-',
          c.observacoes || '',
        ]),
      ];
      const wsCr = XLSX.utils.aoa_to_sheet(crData);
      wsCr['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsCr, 'Contas a Receber');
    }

    // Download
    const fileName = `relatorio_gerencial_costa_urbana_${format(currentDate, 'yyyy-MM-dd')}.xlsx`;
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