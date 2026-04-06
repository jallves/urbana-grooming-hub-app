import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, Package, Scissors, RefreshCw, Heart, ChevronLeft, ChevronRight, AlertTriangle, CreditCard, Award } from 'lucide-react';
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

  return {
    id: record.id,
    amount: Number(record.valor || record.amount || 0),
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

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: "Total Comissões", value: `R$ ${stats.total.toFixed(2)}`, subtitle: "Ganhos totais", IconComponent: DollarSign, variant: 'highlight' as const, color: 'text-urbana-gold' },
          { label: "Pendentes", value: `R$ ${stats.pending.toFixed(2)}`, subtitle: "A receber", IconComponent: Clock, variant: 'warning' as const, color: 'text-yellow-400' },
          { label: "Pagas", value: `R$ ${stats.paid.toFixed(2)}`, subtitle: "Já recebidas", IconComponent: TrendingUp, variant: 'success' as const, color: 'text-green-400' },
          { label: "Serviços", value: `R$ ${stats.serviceCommissions.toFixed(2)}`, subtitle: "Atendimentos", IconComponent: Scissors, variant: 'info' as const, color: 'text-blue-400' },
          { label: "Planos (Uso)", value: `R$ ${(stats.subscriptionUsageCommissions || 0).toFixed(2)}`, subtitle: "Créditos executados", IconComponent: CreditCard, variant: 'default' as const, color: 'text-emerald-400' },
          { label: "Produtos", value: `R$ ${stats.productCommissions.toFixed(2)}`, subtitle: "Vendas", IconComponent: Package, variant: 'default' as const, color: 'text-purple-400' },
          { label: "Gorjetas", value: `R$ ${(stats.tipCommissions || 0).toFixed(2)}`, subtitle: "100% suas", IconComponent: Heart, variant: 'default' as const, color: 'text-pink-400' },
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
                <div className="text-base sm:text-lg md:text-xl font-bold text-urbana-light leading-tight">
                  {stat.value}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">
                  {stat.subtitle}
                </p>
              </PainelBarbeiroCardContent>
            </PainelBarbeiroCard>
          );
        })}
      </div>

      {/* Pending from Previous Months */}
      {pendingFromPrevious.length > 0 && (
        <PainelBarbeiroCard variant="warning" className="mb-4 sm:mb-6">
          <PainelBarbeiroCardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <PainelBarbeiroCardTitle className="text-sm sm:text-base md:text-lg text-yellow-400">
                Pendentes de meses anteriores ({pendingFromPrevious.length})
              </PainelBarbeiroCardTitle>
            </div>
            <p className="text-[10px] sm:text-xs text-urbana-light/60 mt-1 ml-6">
              Total: R$ {pendingFromPrevious.reduce((acc: number, c: any) => acc + c.amount, 0).toFixed(2)}
            </p>
          </PainelBarbeiroCardHeader>
          <PainelBarbeiroCardContent className="px-3 sm:px-4 md:px-6">
            <div className="space-y-1.5 sm:space-y-2">
              {pendingFromPrevious.map(renderCommissionCard)}
            </div>
          </PainelBarbeiroCardContent>
        </PainelBarbeiroCard>
      )}

      {/* Monthly Commissions - Grouped by Category */}
      <PainelBarbeiroCard variant="default">
        <PainelBarbeiroCardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <PainelBarbeiroCardTitle className="text-sm sm:text-base md:text-lg text-urbana-light">
            Detalhamento — {format(selectedMonth, "MMMM/yyyy", { locale: ptBR })}
          </PainelBarbeiroCardTitle>
          <p className="text-[10px] sm:text-xs text-urbana-light/50 mt-1">
            {monthCommissions.length} lançamento(s) no mês
          </p>
        </PainelBarbeiroCardHeader>
        <PainelBarbeiroCardContent className="px-3 sm:px-4 md:px-6">
          {monthCommissions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-light/40 mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-urbana-light/60">Nenhuma comissão neste mês</p>
            </div>
          ) : (
            <div>
              {renderGroupSection(
                'Serviços',
                <Scissors className="h-4 w-4 text-blue-400" />,
                groupedCommissions.service,
                groupedCommissions.service.reduce((a: number, c: any) => a + c.amount, 0),
                'text-blue-400',
                'Comissões de atendimentos realizados'
              )}

              {renderGroupSection(
                'Execução de Plano / Assinatura',
                <CreditCard className="h-4 w-4 text-emerald-400" />,
                groupedCommissions.subscription_usage,
                groupedCommissions.subscription_usage.reduce((a: number, c: any) => a + c.amount, 0),
                'text-emerald-400',
                'Comissões por uso de crédito de plano'
              )}

              {renderGroupSection(
                'Venda de Produtos',
                <Package className="h-4 w-4 text-purple-400" />,
                groupedCommissions.product,
                groupedCommissions.product.reduce((a: number, c: any) => a + c.amount, 0),
                'text-purple-400',
                'Comissões de vendas de produtos'
              )}

              {renderGroupSection(
                'Gorjetas',
                <Heart className="h-4 w-4 text-pink-400" />,
                groupedCommissions.tip,
                groupedCommissions.tip.reduce((a: number, c: any) => a + c.amount, 0),
                'text-pink-400',
                '100% do valor da gorjeta'
              )}
            </div>
          )}
        </PainelBarbeiroCardContent>
      </PainelBarbeiroCard>
    </BarberPageContainer>
  );
};

export default BarberCommissionsComponent;
