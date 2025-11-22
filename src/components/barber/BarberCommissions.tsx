import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, Package, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  commission_type: string;
  item_name: string | null;
  appointment_id: string | null;
  product_sale_id: string | null;
}

interface CommissionStats {
  total: number;
  pending: number;
  paid: number;
  serviceCommissions: number;
  productCommissions: number;
}

const BarberCommissionsComponent: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommissionStats>({
    total: 0,
    pending: 0,
    paid: 0,
    serviceCommissions: 0,
    productCommissions: 0
  });

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);

        // Buscar staff ID do barbeiro - tenta por user_id, depois por email
        let staffData = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'barber')
          .maybeSingle();

        // Fallback: se não encontrar por user_id, busca por email
        if (!staffData?.data && user.email) {
          staffData = await supabase
            .from('staff')
            .select('id')
            .eq('email', user.email)
            .eq('role', 'barber')
            .maybeSingle();
        }

        const staffId = staffData?.data?.id;

        if (!staffId) {
          console.error('Staff ID não encontrado para o usuário:', user.email);
          setLoading(false);
          return;
        }

        console.log('🔍 Buscando comissões do ERP Financeiro para staff:', staffId);

        // ✅ BUSCAR DO ERP FINANCEIRO (financial_records com transaction_type = 'commission')
        const { data: commissionsData, error } = await supabase
          .from('financial_records')
          .select('*')
          .eq('transaction_type', 'commission')
          .eq('barber_id', staffId)
          .order('transaction_date', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar comissões:', error);
          throw error;
        }

        console.log('📊 Comissões encontradas:', commissionsData?.length || 0);

        if (commissionsData) {
          // Mapear financial_records para o formato esperado pelo componente
          const mappedCommissions: Commission[] = commissionsData.map((record) => {
            // Extrair informações do metadata
            const metadata = record.metadata as any;
            const commissionType = record.category === 'Comissões - Serviços' ? 'service' : 'product';
            
            return {
              id: record.id,
              amount: Number(record.net_amount),
              status: record.status === 'completed' ? 'paid' : 'pending',
              created_at: record.transaction_date,
              commission_type: commissionType,
              item_name: record.description,
              appointment_id: record.appointment_id,
              product_sale_id: metadata?.product_sale_id || null
            };
          });

          setCommissions(mappedCommissions);

          // Calcular estatísticas
          const total = mappedCommissions.reduce((acc, comm) => acc + Number(comm.amount), 0);
          const pending = mappedCommissions.filter(c => c.status === 'pending').reduce((acc, comm) => acc + Number(comm.amount), 0);
          const paid = mappedCommissions.filter(c => c.status === 'paid').reduce((acc, comm) => acc + Number(comm.amount), 0);
          const serviceCommissions = mappedCommissions.filter(c => c.commission_type === 'service').reduce((acc, comm) => acc + Number(comm.amount), 0);
          const productCommissions = mappedCommissions.filter(c => c.commission_type === 'product').reduce((acc, comm) => acc + Number(comm.amount), 0);

          setStats({ total, pending, paid, serviceCommissions, productCommissions });

          console.log('📈 Estatísticas calculadas:', { total, pending, paid, serviceCommissions, productCommissions });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar comissões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [user?.email, user?.id]);

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
  };

  if (loading) {
    return <div className="text-white text-center py-8">Carregando comissões...</div>;
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
