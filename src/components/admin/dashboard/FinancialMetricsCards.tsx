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

      const [
        contasReceberMes,
        contasPagarMes,
        contasReceberPrev,
        contasPagarPrev,
      ] = await Promise.all([
        supabase.from('contas_receber').select('valor, status, data_vencimento')
          .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
        supabase.from('contas_pagar').select('valor, status, data_vencimento, categoria')
          .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
        supabase.from('contas_receber').select('valor, status')
          .gte('data_vencimento', prevFirstDay).lte('data_vencimento', prevLastDay),
        supabase.from('contas_pagar').select('valor, status, categoria')
          .gte('data_vencimento', prevFirstDay).lte('data_vencimento', prevLastDay),
      ]);

      const crMes = contasReceberMes.data || [];
      const cpMes = contasPagarMes.data || [];
      const crPrev = contasReceberPrev.data || [];
      const cpPrev = contasPagarPrev.data || [];

      // Current month
      const revenue = crMes.filter(r => isStatusRecebido(r.status)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingReceivables = crMes.filter(r => r.status === 'pendente').reduce((s, r) => s + Number(r.valor), 0);
      const overdueReceivables = crMes.filter(r => r.status === 'pendente' && r.data_vencimento < todayStr).length;

      const paidExpensesAll = cpMes.filter(r => isStatusRecebido(r.status));
      const commissionsPaid = paidExpensesAll.filter(r => isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const expenses = paidExpensesAll.filter(r => !isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingPayables = cpMes.filter(r => r.status === 'pendente' && !isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const pendingCommissions = cpMes.filter(r => r.status === 'pendente' && isCategoriaComissao(r.categoria)).reduce((s, r) => s + Number(r.valor), 0);
      const totalCommissions = commissionsPaid + pendingCommissions;
      const overduePayables = cpMes.filter(r => r.status === 'pendente' && r.data_vencimento < todayStr).length;

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

      return {
        revenue, expenses, commissionsPaid, totalCommissions, profit,
        revenueTrend, expenseTrend, profitTrend,
        pendingReceivables, pendingPayables, pendingCommissions,
        overdueReceivables, overduePayables,
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
        'Soma de TODAS as Contas a Receber (tabela contas_receber) com status "pago" ou "recebido" e vencimento dentro do mês selecionado.\n\nFonte: contas_receber\nFiltros: status IN (pago, recebido) AND data_vencimento BETWEEN início e fim do mês\nFórmula: SUM(valor)',
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency(metrics?.expenses || 0),
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: metrics?.expenseTrend || 0,
      subtitle: metrics?.pendingPayables && metrics.pendingPayables > 0
        ? `${formatCurrency(metrics.pendingPayables)} a pagar`
        : '✓ Todas pagas',
      alert: (metrics?.overduePayables || 0) > 0 ? `${metrics?.overduePayables} vencida(s)` : null,
      explanation:
        'Soma das Contas a Pagar quitadas no mês, EXCLUINDO comissões (que têm card próprio).\n\nFonte: contas_pagar\nFiltros: status IN (pago, recebido) AND categoria NÃO contém "comiss" AND data_vencimento dentro do mês\nFórmula: SUM(valor)',
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
