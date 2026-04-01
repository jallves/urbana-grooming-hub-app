import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CreditCard, Wallet, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FinancialMetricsCardsProps {
  month: number;
  year: number;
}

const isStatusRecebido = (status: string | null) =>
  status === 'recebido' || status === 'pago';

const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({ month, year }) => {
  const { toast } = useToast();
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['financial-dashboard-metrics', month, year],
    queryFn: async () => {
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const prevFirstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const prevLastDay = new Date(year, month, 0).toISOString().split('T')[0];

      const todayStr = new Date().toISOString().split('T')[0];

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

      const allExpenses = cpMes.filter(r => isStatusRecebido(r.status));
      const commissions = allExpenses.filter(r => r.categoria === 'Comissão').reduce((s, r) => s + Number(r.valor), 0);
      const expenses = allExpenses.filter(r => r.categoria !== 'Comissão').reduce((s, r) => s + Number(r.valor), 0);
      const pendingPayables = cpMes.filter(r => r.status === 'pendente').reduce((s, r) => s + Number(r.valor), 0);
      const pendingCommissions = cpMes.filter(r => r.status === 'pendente' && r.categoria === 'Comissão').reduce((s, r) => s + Number(r.valor), 0);
      const overduePayables = cpMes.filter(r => r.status === 'pendente' && r.data_vencimento < todayStr).length;

      // Previous month
      const prevRevenue = crPrev.filter(r => isStatusRecebido(r.status)).reduce((s, r) => s + Number(r.valor), 0);
      const prevAllExp = cpPrev.filter(r => isStatusRecebido(r.status));
      const prevExpenses = prevAllExp.filter(r => r.categoria !== 'Comissão').reduce((s, r) => s + Number(r.valor), 0);

      const profit = revenue - expenses - commissions;
      const prevProfit = prevRevenue - prevExpenses;

      const revenueTrend = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const expenseTrend = prevExpenses ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
      const profitTrend = prevProfit ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

      return {
        revenue, expenses, commissions, profit,
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

  const cards = [
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
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(metrics?.profit || 0),
      icon: Wallet,
      color: metrics && metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: metrics && metrics.profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      trend: metrics?.profitTrend || 0,
      subtitle: `Margem: ${metrics && metrics.revenue ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0'}%`,
    },
    {
      title: 'Comissões do Mês',
      value: formatCurrency(metrics?.commissions || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: metrics?.pendingCommissions && metrics.pendingCommissions > 0
        ? `${formatCurrency(metrics.pendingCommissions)} pendentes`
        : '✓ Todas pagas',
    },
  ];

  const handleRefresh = async () => {
    toast({ title: "Atualizando...", description: "Buscando dados atualizados" });
    await refetch();
    toast({ title: "Atualizado!", description: "Dados financeiros atualizados com sucesso" });
  };

  return (
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
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-2">
                  {card.title}
                </CardTitle>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialMetricsCards;
