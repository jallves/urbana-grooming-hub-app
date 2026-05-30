import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, Package, Scissors, RefreshCw, Heart, ChevronLeft, ChevronRight, AlertTriangle, CreditCard, Award, Wallet, Minus } from 'lucide-react';
import { useBarberCommissionsQuery } from '@/hooks/barber/queries/useBarberCommissionsQuery';
import BarberCommissionsSkeleton from '@/components/ui/loading/BarberCommissionsSkeleton';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatBrazilDateOnly } from '@/lib/utils/dateUtils';
import BarberFilter from '@/components/barber/BarberFilter';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Query for another barber's commissions (read-only for barber admin)
const useOtherBarberCommissions = (barberId: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['barber-commissions-other', barberId],
    queryFn: async () => {
      if (!barberId) return { commissions: [], stats: null };

      const { data: bcData } = await supabase
        .from('barber_commissions')
        .select('*')
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false })
        .limit(100);

      const commissions = (bcData || []).map((record: any) => mapCommissionRecord(record));

      const stats = calcStats(commissions);
      return { commissions, stats };
    },
    enabled: enabled && !!barberId,
    staleTime: 30 * 1000,
  });
};

// Map a barber_commissions record to unified format
const mapCommissionRecord = (record: any) => {
  const tipo = record.tipo || 'servico';
  let commissionType = 'service';
  if (tipo === 'produto') commissionType = 'product';
  if (tipo === 'gorjeta') commissionType = 'tip';
  if (tipo === 'uso_credito_assinatura') commissionType = 'subscription_usage';
  if (tipo === 'servico_extra') commissionType = 'service';

  const commissionAmount = Number(record.valor || record.amount || 0);
  const rate = Number(record.commission_rate || 0);
  const grossRevenue = rate > 0 ? (commissionAmount / (rate / 100)) : commissionAmount;

  return {
    id: record.id,
    amount: commissionAmount,
    gross_revenue: grossRevenue,
    commission_rate: rate,
    status: record.status === 'paid' || record.status === 'pago' ? 'paid' : 'pending',
    created_at: record.created_at || '',
    commission_type: commissionType,
    tipo_original: tipo,
    item_name: null as string | null,
    appointment_id: record.appointment_id,
    product_sale_id: record.venda_id,
    payment_date: record.payment_date || record.data_pagamento || null,
    appointment_source: record.appointment_source || null,
  };
};

const calcStats = (commissions: any[]) => ({
  total: commissions.reduce((acc: number, c: any) => acc + c.amount, 0),
  pending: commissions.filter((c: any) => c.status === 'pending').reduce((acc: number, c: any) => acc + c.amount, 0),
  paid: commissions.filter((c: any) => c.status === 'paid').reduce((acc: number, c: any) => acc + c.amount, 0),
  serviceCommissions: commissions.filter((c: any) => c.commission_type === 'service').reduce((acc: number, c: any) => acc + c.amount, 0),
  productCommissions: commissions.filter((c: any) => c.commission_type === 'product').reduce((acc: number, c: any) => acc + c.amount, 0),
  tipCommissions: commissions.filter((c: any) => c.commission_type === 'tip').reduce((acc: number, c: any) => acc + c.amount, 0),
  subscriptionUsageCommissions: commissions.filter((c: any) => c.commission_type === 'subscription_usage').reduce((acc: number, c: any) => acc + c.amount, 0),
  // Por segmento × status
  servicePaid: commissions.filter((c: any) => c.commission_type === 'service' && c.status === 'paid').reduce((a: number, c: any) => a + c.amount, 0),
  servicePending: commissions.filter((c: any) => c.commission_type === 'service' && c.status === 'pending').reduce((a: number, c: any) => a + c.amount, 0),
  productPaid: commissions.filter((c: any) => c.commission_type === 'product' && c.status === 'paid').reduce((a: number, c: any) => a + c.amount, 0),
  productPending: commissions.filter((c: any) => c.commission_type === 'product' && c.status === 'pending').reduce((a: number, c: any) => a + c.amount, 0),
  tipPaid: commissions.filter((c: any) => c.commission_type === 'tip' && c.status === 'paid').reduce((a: number, c: any) => a + c.amount, 0),
  tipPending: commissions.filter((c: any) => c.commission_type === 'tip' && c.status === 'pending').reduce((a: number, c: any) => a + c.amount, 0),
  subPaid: commissions.filter((c: any) => c.commission_type === 'subscription_usage' && c.status === 'paid').reduce((a: number, c: any) => a + c.amount, 0),
  subPending: commissions.filter((c: any) => c.commission_type === 'subscription_usage' && c.status === 'pending').reduce((a: number, c: any) => a + c.amount, 0),
  // Receita bruta por segmento
  grossService: commissions.filter((c: any) => c.commission_type === 'service').reduce((acc: number, c: any) => acc + (c.gross_revenue || c.amount), 0),
  grossProduct: commissions.filter((c: any) => c.commission_type === 'product').reduce((acc: number, c: any) => acc + (c.gross_revenue || c.amount), 0),
  grossSubscription: commissions.filter((c: any) => c.commission_type === 'subscription_usage').reduce((acc: number, c: any) => acc + (c.gross_revenue || c.amount), 0),
  grossTip: commissions.filter((c: any) => c.commission_type === 'tip').reduce((acc: number, c: any) => acc + (c.gross_revenue || c.amount), 0),
  grossTotal: commissions.reduce((acc: number, c: any) => acc + (c.gross_revenue || c.amount), 0),
});

const BarberCommissionsComponent: React.FC = () => {
  const { data: ownData, isLoading: ownLoading, refetch } = useBarberCommissionsQuery();
  const { data: barberData } = useBarberDataQuery();
  const isBarberAdmin = barberData?.is_barber_admin || false;
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const isViewingOther = isBarberAdmin && selectedBarberId && selectedBarberId !== barberData?.id;

  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const { data: otherData, isLoading: otherLoading } = useOtherBarberCommissions(
    selectedBarberId,
    !!isViewingOther
  );

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const activeData = isViewingOther ? otherData : ownData;
  const isLoading = isViewingOther ? otherLoading : ownLoading;

  // ─── Buscar VALES do barbeiro ativo (contas_pagar categoria = vale) ──────
  const activeBarberId = isViewingOther ? selectedBarberId : barberData?.id || null;

  const { data: valesData } = useQuery({
    queryKey: ['barber-vales', activeBarberId],
    queryFn: async () => {
      if (!activeBarberId) return [];
      // Buscar nome do barbeiro
      const { data: bb } = await supabase
        .from('painel_barbeiros')
        .select('nome')
        .eq('id', activeBarberId)
        .maybeSingle();
      const nome = bb?.nome?.trim();
      if (!nome) return [];

      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .or('categoria.eq.vale,categoria.ilike.%vale%')
        .ilike('fornecedor', nome)
        .order('data_vencimento', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao buscar vales:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!activeBarberId,
    staleTime: 30 * 1000,
  });

  // Realtime para vales
  useEffect(() => {
    if (!activeBarberId) return;
    const channel = supabase
      .channel('barber-vales-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, () => {
        queryClient.invalidateQueries({ queryKey: ['barber-vales', activeBarberId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeBarberId, queryClient]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('barber-commissions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barber_commissions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['barber-commissions'] });
        if (selectedBarberId) queryClient.invalidateQueries({ queryKey: ['barber-commissions-other', selectedBarberId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient, selectedBarberId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['barber-commissions'] });
    if (selectedBarberId) await queryClient.invalidateQueries({ queryKey: ['barber-commissions-other', selectedBarberId] });
    await queryClient.invalidateQueries({ queryKey: ['barber-vales', activeBarberId] });
    await refetch();
    toast.success('Comissões atualizadas!');
    setIsRefreshing(false);
  };
  
  const allCommissions = useMemo(() => {
    const raw = activeData?.commissions || [];
    // Re-map own data to include subscription_usage type
    return raw.map((c: any) => {
      if (c.tipo_original) return c; // already mapped
      // For ownData from useBarberCommissionsQuery, re-classify
      return c;
    });
  }, [activeData]);

  const { monthCommissions, pendingFromPrevious, filteredStats } = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthItems = allCommissions.filter((c: any) => {
      const date = new Date(c.created_at);
      return date >= monthStart && date <= monthEnd;
    });

    const pendingPrev = allCommissions.filter((c: any) => {
      const date = new Date(c.created_at);
      return c.status === 'pending' && isBefore(date, monthStart);
    });

    const monthStats = calcStats(monthItems);
    const pendingPrevTotal = pendingPrev.reduce((acc: number, c: any) => acc + c.amount, 0);

    return { monthCommissions: monthItems, pendingFromPrevious: pendingPrev, filteredStats: monthStats, pendingPrevTotal };
  }, [allCommissions, selectedMonth]);

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleCurrentMonth = () => setSelectedMonth(new Date());

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  }, [selectedMonth]);

  const stats = filteredStats;

  // ─── Filtrar Vales do mês selecionado ─────────────────────────────────
  const monthVales = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return (valesData || []).filter((v: any) => {
      const ref = v.data_vencimento ? new Date(v.data_vencimento + 'T00:00:00') : new Date(v.created_at);
      return ref >= monthStart && ref <= monthEnd;
    });
  }, [valesData, selectedMonth]);

  const valesStats = useMemo(() => {
    const total = monthVales.reduce((s: number, v: any) => s + Number(v.valor || 0), 0);
    const pago = monthVales.filter((v: any) => (v.status || '').toLowerCase() === 'pago')
      .reduce((s: number, v: any) => s + Number(v.valor || 0), 0);
    const pendente = total - pago;
    return { total, pago, pendente, qtd: monthVales.length };
  }, [monthVales]);

  // Líquido a Receber = comissões PENDENTES − vales PENDENTES.
  // Vales já PAGOS já foram abatidos das comissões correspondentes (que viraram 'paid'),
  // então não devem ser descontados novamente.
  const liquidoAReceber = stats.pending - valesStats.pendente;

  // Group commissions by category for detailed view
  const groupedCommissions = useMemo(() => {
    const groups = {
      service: [] as any[],
      subscription_usage: [] as any[],
      product: [] as any[],
      tip: [] as any[],
    };
    
    monthCommissions.forEach((c: any) => {
      const type = c.commission_type as keyof typeof groups;
      if (groups[type]) {
        groups[type].push(c);
      } else {
        groups.service.push(c);
      }
    });

    return groups;
  }, [monthCommissions]);

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] sm:text-[10px]">Paga</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] sm:text-[10px]">Pendente</Badge>;
  };

  const getCommissionIcon = (type: string) => {
    if (type === 'tip') return <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-400 flex-shrink-0" />;
    if (type === 'product') return <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />;
    if (type === 'subscription_usage') return <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400 flex-shrink-0" />;
    return <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />;
  };

  const getCommissionLabel = (type: string) => {
    if (type === 'tip') return 'Gorjeta';
    if (type === 'product') return 'Venda de Produto';
    if (type === 'subscription_usage') return 'Uso de Crédito (Plano)';
    return 'Serviço';
  };

  const getCommissionColor = (type: string) => {
    if (type === 'tip') return 'text-pink-400';
    if (type === 'product') return 'text-purple-400';
    if (type === 'subscription_usage') return 'text-emerald-400';
    return 'text-blue-400';
  };

  const renderCommissionCard = (commission: any) => (
    <div key={commission.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-urbana-black/40 border border-urbana-gold/10">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {getCommissionIcon(commission.commission_type)}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs sm:text-sm text-urbana-light leading-tight truncate">
            {commission.item_name || getCommissionLabel(commission.commission_type)}
          </p>
          <p className="text-[10px] sm:text-xs text-urbana-light/50 mt-0.5">
            {formatBrazilDateOnly(commission.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {getStatusBadge(commission.status)}
        <span className={cn('text-sm sm:text-base font-bold', getCommissionColor(commission.commission_type))}>
          R$ {Number(commission.amount).toFixed(2)}
        </span>
      </div>
    </div>
  );

  const renderGroupSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    totalAmount: number,
    colorClass: string,
    description: string
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-urbana-light">{title}</h3>
              <p className="text-[9px] sm:text-[10px] text-urbana-light/50">{description}</p>
            </div>
          </div>
          <span className={cn('text-sm sm:text-base font-bold', colorClass)}>
            R$ {totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {items.map(renderCommissionCard)}
        </div>
      </div>
    );
  };

  if (isLoading) return <BarberCommissionsSkeleton />;

  return (
    <BarberPageContainer hideHeader>
      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-urbana-gold/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
              {isViewingOther ? 'Comissões' : 'Minhas Comissões'}
            </h1>
            <p className="text-urbana-light/70 text-sm sm:text-base lg:text-lg drop-shadow-md mt-1 sm:mt-2">
              {isViewingOther ? 'Visualizando comissões de outro barbeiro (somente leitura)' : 'Acompanhe seus ganhos detalhados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isBarberAdmin && barberData && (
              <BarberFilter
                isBarberAdmin={isBarberAdmin}
                currentBarberId={barberData.id}
                selectedBarberId={selectedBarberId || barberData.id}
                onBarberChange={setSelectedBarberId}
              />
            )}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm"
              className="flex items-center gap-2 border-urbana-gold/30 bg-transparent text-urbana-light">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Monthly Filter */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}
            className="h-8 w-8 sm:h-9 sm:w-9 border-urbana-gold/20 bg-transparent text-urbana-light">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm sm:text-base md:text-lg font-semibold text-urbana-light capitalize min-w-[140px] sm:min-w-[180px] text-center">
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}
            className="h-8 w-8 sm:h-9 sm:w-9 border-urbana-gold/20 bg-transparent text-urbana-light">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!isCurrentMonth && (
          <Button variant="outline" size="sm" onClick={handleCurrentMonth}
            className="h-8 text-xs sm:text-sm border-urbana-gold/20 bg-transparent text-urbana-gold">
            Mês Atual
          </Button>
        )}
      </div>

      {/* Resumo Financeiro Geral (Total + Saldos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          {
            label: 'Total de Ganhos',
            value: stats.total,
            subtitle: 'Serviços + gorjetas + planos + produtos (tudo incluso)',
            IconComponent: DollarSign,
            variant: 'highlight' as const,
            color: 'text-urbana-gold',
          },
          {
            label: 'Já Pagas',
            value: stats.paid,
            subtitle: 'Comissões quitadas',
            IconComponent: TrendingUp,
            variant: 'success' as const,
            color: 'text-green-400',
          },
          {
            label: 'Vales Registrados',
            value: valesStats.total,
            subtitle: `${valesStats.qtd} lançamento(s) · R$ ${valesStats.pago.toFixed(2)} já pago/abatido · R$ ${valesStats.pendente.toFixed(2)} ainda a descontar`,
            IconComponent: Wallet,
            variant: 'warning' as const,
            color: 'text-orange-400',
          },
          {
            label: 'Líquido a Receber',
            value: liquidoAReceber,
            subtitle: `Total de ganhos − já pagas (R$ ${stats.paid.toFixed(2)}) − vales pendentes (R$ ${valesStats.pendente.toFixed(2)})`,
            IconComponent: Award,
            variant: 'success' as const,
            color: 'text-emerald-400',
          },
        ].map((stat, i) => {
          const IconComp = stat.IconComponent;
          return (
            <PainelBarbeiroCard key={i} variant={stat.variant}>
              <PainelBarbeiroCardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <PainelBarbeiroCardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">
                    {stat.label}
                  </PainelBarbeiroCardTitle>
                  <IconComp className={cn('h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0', stat.color)} />
                </div>
              </PainelBarbeiroCardHeader>
              <PainelBarbeiroCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className={cn('text-base sm:text-lg md:text-xl font-bold leading-tight', stat.color)}>
                  {(stat as any).prefix || ''}R$ {Number(stat.value).toFixed(2)}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">
                  {stat.subtitle}
                </p>
              </PainelBarbeiroCardContent>
            </PainelBarbeiroCard>
          );
        })}
      </div>

      {/* Detalhamento por Segmento (Pago × Pendente) */}
      {/* Vales — sempre listados, mesmo já pagos/abatidos */}
      {monthVales.length > 0 && (
        <PainelBarbeiroCard variant="default" className="mb-4 sm:mb-6">
          <PainelBarbeiroCardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <PainelBarbeiroCardTitle className="text-sm sm:text-base md:text-lg text-urbana-light flex items-center gap-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
              Vales — {format(selectedMonth, "MMMM/yyyy", { locale: ptBR })}
            </PainelBarbeiroCardTitle>
            <p className="text-[10px] sm:text-xs text-urbana-light/50 mt-1">
              Lançamentos de vales (vales pagos já foram abatidos automaticamente das comissões)
            </p>
          </PainelBarbeiroCardHeader>
          <PainelBarbeiroCardContent className="px-3 sm:px-4 md:px-6">
            <div className="space-y-1.5 sm:space-y-2">
              {monthVales.map((v: any) => {
                const isPago = (v.status || '').toLowerCase() === 'pago';
                const dataRef = v.data_pagamento || v.data_vencimento;
                return (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-urbana-black/40 border border-urbana-gold/10">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-urbana-light leading-tight truncate">
                          {v.descricao || 'Vale'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-urbana-light/50 mt-0.5">
                          {dataRef ? formatBrazilDateOnly(dataRef) : ''}
                          {isPago ? ' · abatido das comissões' : ' · ainda a descontar'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPago ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] sm:text-[10px]">Pago/Abatido</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] sm:text-[10px]">Pendente</Badge>
                      )}
                      <span className="text-sm sm:text-base font-bold text-orange-400">
                        − R$ {Number(v.valor || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-urbana-gold/10 px-1">
                <span className="text-xs sm:text-sm text-urbana-light/70">Total de vales no mês</span>
                <span className="text-sm sm:text-base font-bold text-orange-400">− R$ {valesStats.total.toFixed(2)}</span>
              </div>
            </div>
          </PainelBarbeiroCardContent>
        </PainelBarbeiroCard>
      )}

      {/* Detalhamento por Segmento (Pago × Pendente) */}
      <PainelBarbeiroCard variant="default" className="mb-4 sm:mb-6">
        <PainelBarbeiroCardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <PainelBarbeiroCardTitle className="text-sm sm:text-base md:text-lg text-urbana-light flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
            Comissões por Segmento — {format(selectedMonth, "MMMM/yyyy", { locale: ptBR })}
          </PainelBarbeiroCardTitle>
          <p className="text-[10px] sm:text-xs text-urbana-light/50 mt-1">
            Pago × Pendente em cada categoria
          </p>
        </PainelBarbeiroCardHeader>
        <PainelBarbeiroCardContent className="px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Serviços', icon: <Scissors className="h-4 w-4 text-blue-400" />, color: 'text-blue-400', paid: stats.servicePaid, pending: stats.servicePending },
              { label: 'Planos (Uso de Crédito)', icon: <CreditCard className="h-4 w-4 text-emerald-400" />, color: 'text-emerald-400', paid: stats.subPaid, pending: stats.subPending },
              { label: 'Produtos', icon: <Package className="h-4 w-4 text-purple-400" />, color: 'text-purple-400', paid: stats.productPaid, pending: stats.productPending },
              { label: 'Gorjetas', icon: <Heart className="h-4 w-4 text-pink-400" />, color: 'text-pink-400', paid: stats.tipPaid, pending: stats.tipPending },
            ].map((seg, i) => {
              const total = seg.paid + seg.pending;
              if (total === 0) return null;
              return (
                <div key={i} className="rounded-lg bg-urbana-black/40 border border-urbana-gold/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {seg.icon}
                      <span className="text-xs sm:text-sm font-semibold text-urbana-light">{seg.label}</span>
                    </div>
                    <span className={cn('text-sm sm:text-base font-bold', seg.color)}>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded bg-green-500/10 border border-green-500/20 px-2 py-1.5">
                      <p className="text-[10px] text-green-400 font-medium">Pago</p>
                      <p className="text-xs sm:text-sm font-bold text-green-400">R$ {seg.paid.toFixed(2)}</p>
                    </div>
                    <div className="rounded bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5">
                      <p className="text-[10px] text-yellow-400 font-medium">Pendente</p>
                      <p className="text-xs sm:text-sm font-bold text-yellow-400">R$ {seg.pending.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PainelBarbeiroCardContent>
      </PainelBarbeiroCard>

    </BarberPageContainer>
  );
};

export default BarberCommissionsComponent;
