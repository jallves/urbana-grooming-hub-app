
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface CaixaTabProps {
  filters: {
    mes: number;
    ano: number;
    tipo: string;
    barbeiro: string;
  };
}

interface Transaction {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  barbeiro_id?: string;
  staff?: { name: string };
}

const CaixaTab: React.FC<CaixaTabProps> = ({ filters }) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['caixa-transactions', filters],
    queryFn: async () => {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');

      let query = supabase
        .from('finance_transactions')
        .select(`
          *,
          staff:barbeiro_id(name)
        `)
        .eq('data', startDate)
        .order('created_at', { ascending: false });

      if (filters.tipo !== 'todos') {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barbeiro_id', filters.barbeiro);
      }

      const { data } = await query;
      return data as Transaction[] || [];
    }
  });

  const totalReceitas = transactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
  const totalDespesas = transactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
  const saldoDiario = totalReceitas - totalDespesas;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Receitas Hoje
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Despesas Hoje
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Saldo do Dia
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoDiario >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {saldoDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações do Dia */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Movimentações de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma movimentação encontrada para hoje.
              </div>
            ) : (
              transactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.tipo === 'receita' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.tipo === 'receita' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{transaction.descricao}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.categoria} • {transaction.staff?.name || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.tipo === 'receita' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.tipo === 'receita' ? '+' : '-'}R$ {Number(transaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
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

export default CaixaTab;
