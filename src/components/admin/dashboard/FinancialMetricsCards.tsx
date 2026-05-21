import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CreditCard, Wallet, RefreshCw, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getTodayInBrazil } from '@/lib/utils/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FinancialMetricsCardsProps {
  month: number;
  year: number;
}

const isStatusRecebido = (status: string | null) =>
  status === 'recebido' || status === 'pago';

const isCategoriaComissao = (cat: string | null | undefined) => {
  const c = (cat || '').toLowerCase();
  // matches: comissao, comissão, comissao_assinatura, comissao_servico, etc.
  return c.includes('comiss');
};

const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({ month, year }) => {
  const { toast } = useToast();
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['financial-dashboard-metrics', month, year],
    queryFn: async () => {
      const lastDayNum = new Date(year, month + 1, 0).getDate();
      const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const prevLastDayNum = new Date(year, month, 0).getDate();
      const prevFirstDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      const prevLastDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDayNum).padStart(2, '0')}`;

      const todayStr = getTodayInBrazil();

      const firstDayYear = `${year}-01-01`;
      const lastDayYear = `${year}-12-31`;

      const [
        contasReceberMes,
        contasPagarMes,
        contasReceberPrev,
        contasPagarPrev,
        cortesiasMesResult,
        cortesiasAnoResult,
      ] = await Promise.all([
        supabase.from('contas_receber').select('valor, status, data_vencimento, categoria, forma_pagamento')
          .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
        supabase.from('contas_pagar').select('valor, status, data_vencimento, categoria')
          .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
        supabase.from('contas_receber').select('valor, status')
          .gte('data_vencimento', prevFirstDay).lte('data_vencimento', prevLastDay),
        supabase.from('contas_pagar').select('valor, status, categoria')
          .gte('data_vencimento', prevFirstDay).lte('data_vencimento', prevLastDay),
        supabase.from('vendas')
          .select('id, valor_total, observacoes, forma_pagamento')
          .gte('created_at', firstDay)
          .lte('created_at', lastDay + 'T23:59:59')
          .in('status', ['pago', 'PAGO', 'paga', 'PAGA']),
        supabase.from('vendas')
          .select('id, valor_total, observacoes, forma_pagamento')
          .gte('created_at', firstDayYear)
          .lte('created_at', lastDayYear + 'T23:59:59')
          .in('status', ['pago', 'PAGO', 'paga', 'PAGA']),
      ]);

      const crMes = contasReceberMes.data || [];
      const cpMes = contasPagarMes.data || [];
      const crPrev = contasReceberPrev.data || [];
      const cpPrev = contasPagarPrev.data || [];

      // Current month
      const revenue = crMes.filter(r => isStatusRecebido(r.status)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingReceivables = crMes.filter(r => r.status === 'pendente').reduce((s, r) => s + Number(r.valor), 0);
      const overdueReceivables = crMes.filter(r => r.status === 'pendente' && r.data_vencimento < todayStr).length;

      // Breakdown da Receita por categoria (recebido + pendente)
      const normalizeRevenueCat = (cat: string | null | undefined): string => {
        const c = (cat || 'outros').toLowerCase().trim();
        if (c.includes('servico') || c.includes('serviço')) return 'Serviços';
        if (c.includes('produto')) return 'Produtos';
        if (c.includes('gorjeta') || c.includes('tip')) return 'Gorjetas';
        if (c.includes('assinatura') || c.includes('plano')) return 'Assinaturas / Planos';
        if (c.includes('combo')) return 'Combos';
        if (c.includes('cortesia')) return 'Cortesias';
        return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Outros';
      };
      const revenueBreakdownMap = new Map<string, { paid: number; pending: number }>();
      crMes.forEach(r => {
        const key = normalizeRevenueCat((r as any).categoria);
        const cur = revenueBreakdownMap.get(key) || { paid: 0, pending: 0 };
        if (isStatusRecebido(r.status)) cur.paid += Number(r.valor);
        else if (r.status === 'pendente') cur.pending += Number(r.valor);
        revenueBreakdownMap.set(key, cur);
      });
      const revenueBreakdown = Array.from(revenueBreakdownMap.entries())
        .map(([categoria, v]) => ({ categoria, total: v.paid + v.pending, paid: v.paid, pending: v.pending }))
        .filter(b => b.total > 0)
        .sort((a, b) => b.paid - a.paid);
      const revenueTotalReal = revenue; // alias semântico
      const pct = (n: number) => revenueTotalReal > 0 ? (n / revenueTotalReal) * 100 : 0;

      const paidExpensesAll = cpMes.filter(r => isStatusRecebido(r.status));
      const pendingExpensesAll = cpMes.filter(r => r.status === 'pendente');
      const commissionsPaid = paidExpensesAll.filter(r => isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingCommissions = pendingExpensesAll.filter(r => isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const totalCommissions = commissionsPaid + pendingCommissions;
      // Despesas TOTAIS do mês (todas as categorias, incluindo comissões)
      const expensesPaid = paidExpensesAll.reduce((s, r) => s + Number(r.valor), 0);
      const expensesPending = pendingExpensesAll.reduce((s, r) => s + Number(r.valor), 0);
      // expenses (exclui comissões) — usado no cálculo do lucro para evitar dupla contagem com commissionsPaid
      const expenses = paidExpensesAll.filter(r => !isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingPayables = pendingExpensesAll.filter(r => !isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const overduePayables = cpMes.filter(r => r.status === 'pendente' && r.data_vencimento < todayStr).length;

      // Breakdown por categoria (todas as despesas pagas + pendentes)
      const breakdownMap = new Map<string, { paid: number; pending: number }>();
      const normalizeCat = (cat: string | null | undefined): string => {
        const c = (cat || 'outros').toLowerCase();
        if (c.includes('comiss')) {
          if (c.includes('assinatura')) return 'Comissão (Assinatura)';
          if (c.includes('produto')) return 'Comissão (Produto)';
          return 'Comissão (Serviço)';
        }
        if (c === 'vale') return 'Vale';
        if (c === 'gorjeta') return 'Gorjeta';
        if (c === 'produto') return 'Produto';
        if (c === 'aluguel') return 'Aluguel';
        if (c === 'luz' || c === 'energia') return 'Energia';
        if (c === 'agua') return 'Água';
        if (c === 'internet') return 'Internet';
        if (c === 'fornecedor') return 'Fornecedor';
        return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Outros';
      };
      cpMes.forEach(r => {
        const key = normalizeCat(r.categoria);
        const cur = breakdownMap.get(key) || { paid: 0, pending: 0 };
        if (isStatusRecebido(r.status)) cur.paid += Number(r.valor);
        else if (r.status === 'pendente') cur.pending += Number(r.valor);
        breakdownMap.set(key, cur);
      });
      const expenseBreakdown = Array.from(breakdownMap.entries())
        .map(([categoria, v]) => ({ categoria, total: v.paid + v.pending, paid: v.paid, pending: v.pending }))
        .sort((a, b) => b.total - a.total);

      // Previous month
      const prevRevenue = crPrev.filter(r => isStatusRecebido(r.status)).reduce((s, r) => s + Number(r.valor), 0);
      const prevAllExp = cpPrev.filter(r => isStatusRecebido(r.status));
      const prevExpenses = prevAllExp.filter(r => !isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const prevCommissions = prevAllExp.filter(r => isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);

      const profit = revenue - expenses - commissionsPaid;
      const prevProfit = prevRevenue - prevExpenses - prevCommissions;

      const revenueTrend = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const expenseTrend = prevExpenses ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
      const profitTrend = prevProfit ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

      // ===== Cortesias (estimativa de valor potencial) =====
      // Cortesias = vendas com valor_total = 0 OU marcadas explicitamente como cortesia.
      // Para CADA cortesia zerada buscamos o PREÇO REAL do serviço/produto em vendas_itens
      // → painel_servicos / painel_produtos. Para cortesias com valor_total > 0 (override admin)
      // mantemos o próprio valor da venda.
      const isCortesia = (v: { valor_total: number | null; observacoes: string | null; forma_pagamento: string | null }) => {
        const obs = (v.observacoes || '').toLowerCase();
        const fp = (v.forma_pagamento || '').toLowerCase();
        return Number(v.valor_total) === 0 || obs.includes('cortesia') || fp.includes('cortesia');
      };

      const cortesiasMes = (cortesiasMesResult.data || []).filter(isCortesia);
      const cortesiasAno = (cortesiasAnoResult.data || []).filter(isCortesia);

      // Buscar itens reais (preço original) para todas as cortesias zeradas do ano
      const allCortesiaIds = Array.from(
        new Set([...cortesiasMes, ...cortesiasAno].filter(v => Number(v.valor_total) === 0).map(v => v.id))
      );

      let itensByVenda = new Map<string, number>(); // venda_id -> soma de preços reais
      if (allCortesiaIds.length > 0) {
        const [itensResult, servicosResult, produtosResult] = await Promise.all([
          supabase.from('vendas_itens')
            .select('venda_id, tipo, item_id, quantidade, preco_unitario, subtotal')
            .in('venda_id', allCortesiaIds),
          supabase.from('painel_servicos').select('id, preco'),
          supabase.from('painel_produtos').select('id, preco'),
        ]);
        const servicoPreco = new Map<string, number>();
        (servicosResult.data || []).forEach((s: any) => servicoPreco.set(s.id, Number(s.preco || 0)));
        const produtoPreco = new Map<string, number>();
        (produtosResult.data || []).forEach((p: any) => produtoPreco.set(p.id, Number(p.preco || 0)));

        (itensResult.data || []).forEach((it: any) => {
          const tipo = String(it.tipo || '').toLowerCase();
          const qtd = Number(it.quantidade || 1);
          // Se o item já tem preço (ex: override pago), usa-o; senão busca catálogo
          let unit = Number(it.preco_unitario || 0);
          if (unit === 0) {
            if (tipo.includes('produto')) unit = produtoPreco.get(it.item_id) || 0;
            else unit = servicoPreco.get(it.item_id) || 0; // servico, servico_extra
          }
          const linha = unit * qtd;
          itensByVenda.set(it.venda_id, (itensByVenda.get(it.venda_id) || 0) + linha);
        });
      }

      const valorCortesia = (v: { id: string; valor_total: number | null }) => {
        const valor = Number(v.valor_total || 0);
        if (valor > 0) return valor; // override admin já paga
        return itensByVenda.get(v.id) || 0;
      };

      const cortesiasQtdMes = cortesiasMes.length;
      const cortesiasValorMes = cortesiasMes.reduce((s, v) => s + valorCortesia(v), 0);
      const cortesiasQtdAno = cortesiasAno.length;
      const cortesiasValorAno = cortesiasAno.reduce((s, v) => s + valorCortesia(v), 0);

      return {
        revenue, expenses, expensesPaid, expensesPending, commissionsPaid, totalCommissions, profit,
        revenueTrend, expenseTrend, profitTrend,
        pendingReceivables, pendingPayables, pendingCommissions,
        overdueReceivables, overduePayables,
        cortesiasQtdMes, cortesiasValorMes,
        cortesiasQtdAno, cortesiasValorAno,
        expenseBreakdown,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-white border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards: Array<{
    title: string;
    value: string;
    icon: any;
    color: string;
    bgColor: string;
    trend?: number;
    subtitle: string;
    alert?: string | null;
    explanation: string;
    extra?: React.ReactNode;
  }> = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(metrics?.revenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: metrics?.revenueTrend || 0,
      subtitle: metrics?.pendingReceivables && metrics.pendingReceivables > 0
        ? `${formatCurrency(metrics.pendingReceivables)} a receber`
        : '✓ Tudo recebido',
      alert: (metrics?.overdueReceivables || 0) > 0 ? `${metrics?.overdueReceivables} vencida(s)` : null,
      explanation:
        'Soma de TODAS as Contas a Receber (tabela contas_receber) com status "pago" ou "recebido" e vencimento dentro do mês selecionado.\n\nFonte: contas_receber\nFiltros: status IN (pago, recebido) AND data_vencimento BETWEEN início e fim do mês\nFórmula: SUM(valor)\n\nObs: cortesias NÃO entram aqui (não geraram receita). O bloco "Cortesias" mostra quanto teria sido faturado se cobradas.',
      extra: (
        <div className="mt-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-green-50 px-2 py-1 border border-green-100">
              <p className="text-[10px] text-green-700 font-medium">Recebido</p>
              <p className="text-xs sm:text-sm font-bold text-green-700">{formatCurrency(metrics?.revenue || 0)}</p>
            </div>
            <div className="rounded bg-rose-50 px-2 py-1 border border-rose-100">
              <p className="text-[10px] text-rose-700 font-medium">Cortesias ({metrics?.cortesiasQtdMes || 0})</p>
              <p className="text-xs sm:text-sm font-bold text-rose-700">~{formatCurrency(metrics?.cortesiasValorMes || 0)}</p>
            </div>
          </div>
          <div className="rounded bg-slate-50 px-2 py-1 border border-slate-200 flex items-center justify-between">
            <p className="text-[10px] text-slate-600 font-medium">Total potencial</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">{formatCurrency((metrics?.revenue || 0) + (metrics?.cortesiasValorMes || 0))}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency((metrics?.expensesPaid || 0) + (metrics?.expensesPending || 0)),
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: metrics?.expenseTrend || 0,
      subtitle: 'Todas as despesas do mês',
      alert: (metrics?.overduePayables || 0) > 0 ? `${metrics?.overduePayables} vencida(s)` : null,
      explanation:
        'Soma de TODAS as despesas (pagas + pendentes) lançadas em Contas a Pagar no mês — incluindo comissões, vales, gorjetas, comissões de produto, aluguel, energia, água, internet, fornecedores, etc.\n\nFonte: contas_pagar\nFiltro: data_vencimento dentro do mês\nFórmula: SUM(valor) para todas as categorias\n\nO breakdown abaixo mostra cada segmento separadamente. O card "Comissões do Mês" exibe a mesma informação focada apenas em comissões.',
      extra: (
        <div className="mt-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-green-50 px-2 py-1 border border-green-100">
              <p className="text-[10px] text-green-700 font-medium">Pagas</p>
              <p className="text-xs sm:text-sm font-bold text-green-700">{formatCurrency(metrics?.expensesPaid || 0)}</p>
            </div>
            <div className="rounded bg-amber-50 px-2 py-1 border border-amber-100">
              <p className="text-[10px] text-amber-700 font-medium">A pagar</p>
              <p className="text-xs sm:text-sm font-bold text-amber-700">{formatCurrency(metrics?.expensesPending || 0)}</p>
            </div>
          </div>
          {metrics?.expenseBreakdown && metrics.expenseBreakdown.length > 0 && (
            <div className="rounded bg-slate-50 px-2 py-1.5 border border-slate-200 space-y-1">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Por categoria</p>
              {metrics.expenseBreakdown.map((b) => (
                <div key={b.categoria} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 truncate pr-2">{b.categoria}</span>
                  <span className="font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(b.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(metrics?.profit || 0),
      icon: Wallet,
      color: metrics && metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: metrics && metrics.profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      trend: metrics?.profitTrend || 0,
      subtitle: `Margem: ${metrics && metrics.revenue ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0'}%`,
      explanation:
        'Resultado real da barbearia no mês.\n\nFórmula: Receita do Mês − Despesas do Mês − Comissões Pagas\n\nMargem = (Lucro ÷ Receita) × 100\n\nObservação: apenas comissões já PAGAS entram aqui — comissões pendentes não impactam o lucro até serem quitadas.',
    },
    {
      title: 'Comissões do Mês',
      value: formatCurrency(metrics?.totalCommissions || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: 'Total bruto do mês',
      explanation:
        'Soma de TODAS as comissões dos barbeiros (serviços, produtos, assinaturas) com vencimento no mês selecionado.\n\nFonte: contas_pagar\nFiltro: categoria contém "comiss" (comissao, comissao_assinatura, etc.)\n\nO card mostra Pagas e Pendentes separadamente para você acompanhar o que ainda precisa ser quitado.',
      extra: (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="rounded bg-green-50 px-2 py-1 border border-green-100">
            <p className="text-[10px] text-green-700 font-medium">Pagas</p>
            <p className="text-xs sm:text-sm font-bold text-green-700">{formatCurrency(metrics?.commissionsPaid || 0)}</p>
          </div>
          <div className="rounded bg-amber-50 px-2 py-1 border border-amber-100">
            <p className="text-[10px] text-amber-700 font-medium">Pendentes</p>
            <p className="text-xs sm:text-sm font-bold text-amber-700">{formatCurrency(metrics?.pendingCommissions || 0)}</p>
          </div>
        </div>
      ),
    },
  ];

  const handleRefresh = async () => {
    toast({ title: "Atualizando...", description: "Buscando dados atualizados" });
    await refetch();
    toast({ title: "Atualizado!", description: "Dados financeiros atualizados com sucesso" });
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation text-xs sm:text-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const isPositiveTrend = (card.trend || 0) > 0;
          const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

          return (
            <Card key={index} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center gap-1 min-w-0 flex-1 pr-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {card.title}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
                      {card.explanation}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {card.value}
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendIcon className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className="truncate">{Math.abs(card.trend).toFixed(1)}% vs mês anterior</span>
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 truncate">{card.subtitle}</p>
                {card.alert && (
                  <div className="flex items-center mt-1 sm:mt-2 text-[10px] sm:text-xs text-orange-600 bg-orange-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    <AlertCircle className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className="truncate">{card.alert}</span>
                  </div>
                )}
                {card.extra}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default FinancialMetricsCards;
