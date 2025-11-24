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
    <div className="w-full px-4 space-y-4 sm:space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-urbana-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.total.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Todas as comissões</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.pending.toFixed(2)}</div>
            <p className="text-xs text-gray-400">A receber</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.paid.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Recebidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.serviceCommissions.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Comissões de serviços</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Produtos</CardTitle>
            <Package className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.productCommissions.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Comissões de produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comissões */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <div>
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma comissão encontrada</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <Card key={commission.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {commission.commission_type === 'service' ? (
                            <Scissors className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Package className="h-4 w-4 text-purple-400" />
                          )}
                          <p className="font-medium text-white">
                            {commission.item_name || (commission.commission_type === 'service' ? 'Serviço' : 'Produto')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {format(new Date(commission.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant={commission.commission_type === 'service' ? 'default' : 'secondary'} className="text-xs">
                            {commission.commission_type === 'service' ? 'Serviço' : 'Produto'}
                          </Badge>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-urbana-gold">
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
