
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, User, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComissoesTabProps {
  filters: {
    mes: number;
    ano: number;
    tipo: string;
    barbeiro: string;
  };
}

interface Commission {
  id: string;
  valor: number;
  percentual: number;
  data: string;
  status: 'gerado' | 'pago';
  agendamento_id: string;
  barbeiro_id: string;
  staff?: { name: string };
  painel_agendamentos?: {
    painel_clientes?: { nome: string };
    painel_servicos?: { nome: string };
  };
}

const ComissoesTab: React.FC<ComissoesTabProps> = ({ filters }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      let query = supabase
        .from('comissoes')
        .select(`
          *,
          staff:barbeiro_id(name),
          painel_agendamentos:agendamento_id(
            painel_clientes:cliente_id(nome),
            painel_servicos:servico_id(nome)
          )
        `)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'))
        .order('data', { ascending: false });

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barbeiro_id', filters.barbeiro);
      }

      const { data } = await query;
      return data as Commission[] || [];
    }
  });

  const { data: commissionStats } = useQuery({
    queryKey: ['commission-stats', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      let query = supabase
        .from('comissoes')
        .select('valor, status, barbeiro_id, staff:barbeiro_id(name)')
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barbeiro_id', filters.barbeiro);
      }

      const { data } = await query;
      
      const stats = data?.reduce((acc, commission) => {
        const staffName = commission.staff?.name || 'Desconhecido';
        if (!acc[staffName]) {
          acc[staffName] = { total: 0, pago: 0, pendente: 0 };
        }
        acc[staffName].total += Number(commission.valor);
        if (commission.status === 'pago') {
          acc[staffName].pago += Number(commission.valor);
        } else {
          acc[staffName].pendente += Number(commission.valor);
        }
        return acc;
      }, {} as Record<string, { total: number; pago: number; pendente: number }>);

      return stats || {};
    }
  });

  const payCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({ status: 'pago' })
        .eq('id', commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      toast({
        title: 'Comissão paga',
        description: 'A comissão foi marcada como paga.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a comissão como paga.',
        variant: 'destructive',
      });
    }
  });

  const handlePayCommission = (commissionId: string) => {
    if (confirm('Tem certeza que deseja marcar esta comissão como paga?')) {
      payCommissionMutation.mutate(commissionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo por Barbeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(commissionStats || {}).map(([staffName, stats]) => (
          <Card key={staffName} className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {staffName}
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total:</span>
                  <span className="text-sm font-medium text-white">
                    R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Pago:</span>
                  <span className="text-sm font-medium text-green-500">
                    R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Pendente:</span>
                  <span className="text-sm font-medium text-yellow-500">
                    R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Comissões */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Comissões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma comissão encontrada para o período selecionado.
              </div>
            ) : (
              commissions?.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      commission.status === 'pago' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      {commission.status === 'pago' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{commission.staff?.name}</p>
                      <p className="text-sm text-gray-400">
                        {commission.painel_agendamentos?.painel_servicos?.nome} • {commission.painel_agendamentos?.painel_clientes?.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(commission.data), 'dd/MM/yyyy', { locale: ptBR })} • {commission.percentual}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        R$ {Number(commission.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={commission.status === 'pago' ? 'default' : 'secondary'}>
                        {commission.status}
                      </Badge>
                    </div>
                    {commission.status === 'gerado' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayCommission(commission.id)}
                        disabled={payCommissionMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComissoesTab;
