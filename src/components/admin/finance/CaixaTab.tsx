
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Calendar, Scissors } from 'lucide-react';

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
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  time: string;
  payment_method?: string;
  barber?: string;
}

const CaixaTab: React.FC<CaixaTabProps> = ({ filters }) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['daily-transactions', filters],
    queryFn: async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Buscar agendamentos concluídos do dia (receitas)
      const { data: agendamentos } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          painel_servicos!inner(nome, preco),
          painel_barbeiros!inner(nome)
        `)
        .eq('status', 'concluido')
        .eq('data', todayStr);

      // Buscar transações do fluxo de caixa do dia (despesas)
      const { data: cashFlow } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('transaction_date', todayStr);

      const transactions: Transaction[] = [];

      // Adicionar receitas dos agendamentos
      agendamentos?.forEach(agendamento => {
        transactions.push({
          id: `agendamento-${agendamento.id}`,
          type: 'income',
          amount: Number(agendamento.painel_servicos?.preco || 0),
          description: `Serviço: ${agendamento.painel_servicos?.nome}`,
          category: 'Serviços',
          time: agendamento.hora || '',
          barber: agendamento.painel_barbeiros?.nome
        });
      });

      // Adicionar transações do fluxo de caixa
      cashFlow?.forEach(transaction => {
        transactions.push({
          id: `cash-${transaction.id}`,
          type: transaction.transaction_type as 'income' | 'expense',
          amount: Number(transaction.amount),
          description: transaction.description,
          category: transaction.category,
          time: format(new Date(transaction.created_at), 'HH:mm'),
          payment_method: transaction.payment_method
        });
      });

      // Ordenar por horário
      return transactions.sort((a, b) => b.time.localeCompare(a.time));
    }
  });

  const totals = transactions?.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.receitas += transaction.amount;
      } else {
        acc.despesas += transaction.amount;
      }
      return acc;
    },
    { receitas: 0, despesas: 0 }
  ) || { receitas: 0, despesas: 0 };

  const saldoDiario = totals.receitas - totals.despesas;

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
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Receitas Hoje
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Despesas Hoje
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Saldo do Dia
            </CardTitle>
            <Calendar className="h-4 w-4 text-urbana-gold" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoDiario >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações do Dia */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-gray-900">Movimentações de Hoje</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {transactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Nenhuma movimentação encontrada para hoje.
              </div>
            ) : (
              transactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.category === 'Serviços' ? (
                        <Scissors className="h-4 w-4 text-green-600" />
                      ) : transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.category} • {transaction.barber || 'Sistema'}
                        {transaction.time && ` • ${transaction.time}`}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-gray-500">
                          Via: {transaction.payment_method}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
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
