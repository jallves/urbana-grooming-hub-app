import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, Package, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBarberCommissionsQuery } from '@/hooks/barber/queries/useBarberCommissionsQuery';
import BarberCommissionsSkeleton from '@/components/ui/loading/BarberCommissionsSkeleton';

const BarberCommissionsComponent: React.FC = () => {
  const { data, isLoading } = useBarberCommissionsQuery();
  
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
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6 mt-4 px-2 sm:px-0">
      {/* Cards de Estatísticas - Mobile First Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-urbana-gold flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">R$ {stats.total.toFixed(2)}</div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">Todas comissões</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">Pendentes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">R$ {stats.pending.toFixed(2)}</div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">A receber</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">Pagas</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">R$ {stats.paid.toFixed(2)}</div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">Recebidas</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">Serviços</CardTitle>
            <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">R$ {stats.serviceCommissions.toFixed(2)}</div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">De serviços</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">Produtos</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">R$ {stats.productCommissions.toFixed(2)}</div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight mt-0.5">De produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comissões - Responsive */}
      <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
        <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-base md:text-lg text-urbana-light">Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
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
                <Card key={commission.id} className="backdrop-blur-sm bg-urbana-black/30 border-urbana-gold/10 hover:bg-urbana-black/40 hover:border-urbana-gold/20 transition-all">
                  <CardContent className="p-3 sm:p-4 md:pt-6">
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
                          {format(new Date(commission.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissionsComponent;
