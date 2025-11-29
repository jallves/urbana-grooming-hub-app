import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, Package, Scissors, RefreshCw } from 'lucide-react';
import { useBarberCommissionsQuery } from '@/hooks/barber/queries/useBarberCommissionsQuery';
import BarberCommissionsSkeleton from '@/components/ui/loading/BarberCommissionsSkeleton';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatBrazilDateOnly } from '@/lib/utils/dateUtils';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';
import { cn } from '@/lib/utils';

const BarberCommissionsComponent: React.FC = () => {
  const { data, isLoading, refetch } = useBarberCommissionsQuery();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Forçando atualização das comissões...');
    
    // Invalidar e refetch
    await queryClient.invalidateQueries({ queryKey: ['barber-commissions'] });
    await refetch();
    
    toast.success('Comissões atualizadas!');
    setIsRefreshing(false);
  };
  
  const commissions = data?.commissions || [];
  const stats = data?.stats || {
    total: 0,
    pending: 0,
    paid: 0,
    serviceCommissions: 0,
    productCommissions: 0
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
  };

  if (isLoading) {
    return <BarberCommissionsSkeleton />;
  }

  return (
    <BarberPageContainer hideHeader>
      {/* Header da página */}
      <div className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-urbana-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
              Minhas Comissões
            </h1>
            <p className="text-urbana-light/70 text-sm sm:text-base lg:text-lg drop-shadow-md mt-1 sm:mt-2">
              Acompanhe seus ganhos
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-urbana-gold/30 bg-transparent text-urbana-light hover:bg-urbana-gold/10"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas - Mobile First Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {[
          {
            label: "Total",
            value: `R$ ${stats.total.toFixed(2)}`,
            subtitle: "Todas comissões",
            IconComponent: DollarSign,
            variant: 'highlight' as const,
          },
          {
            label: "Pendentes",
            value: `R$ ${stats.pending.toFixed(2)}`,
            subtitle: "A receber",
            IconComponent: Clock,
            variant: 'warning' as const,
          },
          {
            label: "Pagas",
            value: `R$ ${stats.paid.toFixed(2)}`,
            subtitle: "Recebidas",
            IconComponent: TrendingUp,
            variant: 'success' as const,
          },
          {
            label: "Serviços",
            value: `R$ ${stats.serviceCommissions.toFixed(2)}`,
            subtitle: "De serviços",
            IconComponent: Scissors,
            variant: 'info' as const,
          },
          {
            label: "Produtos",
            value: `R$ ${stats.productCommissions.toFixed(2)}`,
            subtitle: "De produtos",
            IconComponent: Package,
            variant: 'default' as const,
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
                  <IconComp className={cn(
                    'h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0',
                    stat.variant === 'highlight' && 'text-urbana-gold',
                    stat.variant === 'warning' && 'text-yellow-400',
                    stat.variant === 'success' && 'text-green-400',
                    stat.variant === 'info' && 'text-blue-400',
                    stat.variant === 'default' && 'text-purple-400'
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
              <div>
                <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-light/40 mx-auto mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-urbana-light/60">Nenhuma comissão encontrada</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {commissions.map((commission) => (
                <PainelBarbeiroCard 
                  key={commission.id} 
                  variant="default"
                  className="hover:bg-urbana-black/40 hover:border-urbana-gold/20 transition-all"
                >
                  <PainelBarbeiroCardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          {commission.commission_type === 'service' ? (
                            <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                          ) : (
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                          )}
                          <p className="font-medium text-xs sm:text-sm md:text-base text-urbana-light leading-tight">
                            {commission.item_name || (commission.commission_type === 'service' ? 'Serviço' : 'Produto')}
                          </p>
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 mb-2">
                          {formatBrazilDateOnly(commission.created_at)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <Badge variant={commission.commission_type === 'service' ? 'default' : 'secondary'} className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5">
                            {commission.commission_type === 'service' ? 'Serviço' : 'Produto'}
                          </Badge>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-gold leading-tight">
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
