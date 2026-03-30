import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, Package, Scissors, RefreshCw, Heart } from 'lucide-react';
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

      const commissions = (bcData || []).map((record: any) => {
        const tipo = record.tipo || 'servico';
        let commissionType = 'service';
        if (tipo === 'produto') commissionType = 'product';
        if (tipo === 'gorjeta') commissionType = 'tip';

        return {
          id: record.id,
          amount: Number(record.valor || record.amount || 0),
          status: record.status === 'paid' || record.status === 'pago' ? 'paid' : 'pending',
          created_at: record.created_at || '',
          commission_type: commissionType,
          item_name: null,
          appointment_id: record.appointment_id,
          product_sale_id: record.venda_id,
          payment_date: record.payment_date || record.data_pagamento || null,
        };
      });

      const stats = {
        total: commissions.reduce((acc: number, c: any) => acc + c.amount, 0),
        pending: commissions.filter((c: any) => c.status === 'pending').reduce((acc: number, c: any) => acc + c.amount, 0),
        paid: commissions.filter((c: any) => c.status === 'paid').reduce((acc: number, c: any) => acc + c.amount, 0),
        serviceCommissions: commissions.filter((c: any) => c.commission_type === 'service').reduce((acc: number, c: any) => acc + c.amount, 0),
        productCommissions: commissions.filter((c: any) => c.commission_type === 'product').reduce((acc: number, c: any) => acc + c.amount, 0),
        tipCommissions: commissions.filter((c: any) => c.commission_type === 'tip').reduce((acc: number, c: any) => acc + c.amount, 0),
      };

      return { commissions, stats };
    },
    enabled: enabled && !!barberId,
    staleTime: 30 * 1000,
  });
};

const BarberCommissionsComponent: React.FC = () => {
  const { data: ownData, isLoading: ownLoading, refetch } = useBarberCommissionsQuery();
  const { data: barberData } = useBarberDataQuery();
  const isBarberAdmin = barberData?.is_barber_admin || false;
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const isViewingOther = isBarberAdmin && selectedBarberId && selectedBarberId !== barberData?.id;

  const { data: otherData, isLoading: otherLoading } = useOtherBarberCommissions(
    selectedBarberId,
    !!isViewingOther
  );

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const activeData = isViewingOther ? otherData : ownData;
  const isLoading = isViewingOther ? otherLoading : ownLoading;

  // Real-time updates
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
  
  const commissions = activeData?.commissions || [];
  const stats = activeData?.stats || { total: 0, pending: 0, paid: 0, serviceCommissions: 0, productCommissions: 0, tipCommissions: 0 };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
  };

  const getCommissionIcon = (type: string) => {
    if (type === 'tip') return <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-400 flex-shrink-0" />;
    if (type === 'product') return <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />;
    return <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />;
  };

  const getCommissionLabel = (type: string) => {
    if (type === 'tip') return 'Gorjeta';
    if (type === 'product') return 'Produto';
    return 'Serviço';
  };

  if (isLoading) return <BarberCommissionsSkeleton />;

  return (
    <BarberPageContainer hideHeader>
      {/* Header */}
      <div className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-urbana-gold/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
              {isViewingOther ? 'Comissões' : 'Minhas Comissões'}
            </h1>
            <p className="text-urbana-light/70 text-sm sm:text-base lg:text-lg drop-shadow-md mt-1 sm:mt-2">
              {isViewingOther ? 'Visualizando comissões de outro barbeiro (somente leitura)' : 'Acompanhe seus ganhos'}
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
              className="flex items-center gap-2 border-urbana-gold/30 bg-transparent text-urbana-light hover:bg-urbana-gold/10">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {[
          { label: "Total", value: `R$ ${stats.total.toFixed(2)}`, subtitle: "Todas comissões", IconComponent: DollarSign, variant: 'highlight' as const },
          { label: "Pendentes", value: `R$ ${stats.pending.toFixed(2)}`, subtitle: "A receber", IconComponent: Clock, variant: 'warning' as const },
          { label: "Pagas", value: `R$ ${stats.paid.toFixed(2)}`, subtitle: "Recebidas", IconComponent: TrendingUp, variant: 'success' as const },
          { label: "Serviços", value: `R$ ${stats.serviceCommissions.toFixed(2)}`, subtitle: "De serviços", IconComponent: Scissors, variant: 'info' as const },
          { label: "Produtos", value: `R$ ${stats.productCommissions.toFixed(2)}`, subtitle: "De produtos", IconComponent: Package, variant: 'default' as const },
          { label: "Gorjetas", value: `R$ ${(stats.tipCommissions || 0).toFixed(2)}`, subtitle: "100% suas", IconComponent: Heart, variant: 'default' as const },
        ].map((stat, i) => {
          const IconComp = stat.IconComponent;
          return (
            <PainelBarbeiroCard key={i} variant={stat.variant}>
              <PainelBarbeiroCardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <PainelBarbeiroCardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">
                    {stat.label}
                  </PainelBarbeiroCardTitle>
                  <IconComp className={cn(
                    'h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0',
                    stat.variant === 'highlight' && 'text-urbana-gold',
                    stat.variant === 'warning' && 'text-yellow-400',
                    stat.variant === 'success' && 'text-green-400',
                    stat.variant === 'info' && 'text-blue-400',
                    stat.variant === 'default' && 'text-purple-400',
                    stat.label === 'Gorjetas' && 'text-pink-400'
                  )} />
                </div>
              </PainelBarbeiroCardHeader>
              <PainelBarbeiroCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">
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

      {/* Lista de Comissões */}
      <PainelBarbeiroCard variant="default">
        <PainelBarbeiroCardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <PainelBarbeiroCardTitle className="text-sm sm:text-base md:text-lg text-urbana-light">
            Histórico de Comissões
          </PainelBarbeiroCardTitle>
        </PainelBarbeiroCardHeader>
        <PainelBarbeiroCardContent className="px-3 sm:px-4 md:px-6">
          {commissions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-light/40 mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-urbana-light/60">Nenhuma comissão encontrada</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {commissions.map((commission: any) => (
                <PainelBarbeiroCard key={commission.id} variant="default"
                  className="hover:bg-urbana-black/40 hover:border-urbana-gold/20 transition-all">
                  <PainelBarbeiroCardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          {getCommissionIcon(commission.commission_type)}
                          <p className="font-medium text-xs sm:text-sm md:text-base text-urbana-light leading-tight">
                            {commission.item_name || getCommissionLabel(commission.commission_type)}
                          </p>
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 mb-2">
                          {formatBrazilDateOnly(commission.created_at)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <Badge variant={commission.commission_type === 'tip' ? 'default' : commission.commission_type === 'service' ? 'default' : 'secondary'}
                            className={`text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 ${commission.commission_type === 'tip' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : ''}`}>
                            {getCommissionLabel(commission.commission_type)}
                          </Badge>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className={`text-lg sm:text-xl md:text-2xl font-bold leading-tight ${commission.commission_type === 'tip' ? 'text-pink-400' : 'text-urbana-gold'}`}>
                          R$ {Number(commission.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </PainelBarbeiroCardContent>
                </PainelBarbeiroCard>
              ))}
            </div>
          )}
        </PainelBarbeiroCardContent>
      </PainelBarbeiroCard>
    </BarberPageContainer>
  );
};

export default BarberCommissionsComponent;
