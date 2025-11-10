import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, Loader2, DollarSign, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRecord {
  payment_method: string;
}

interface FinancialRecord {
  id: string;
  transaction_number: string;
  transaction_type: string;
  category: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  status: string;
  description: string;
  transaction_date: string;
  created_at: string;
  payment_records: PaymentRecord[];
}

export const ContasAPagar: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: payables, isLoading } = useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          payment_records(payment_method)
        `)
        .in('transaction_type', ['expense', 'commission'])
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('financial_records')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Comissão marcada como paga!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como paga', {
        description: error.message
      });
    }
  });

  // Calcular totais
  const totals = React.useMemo(() => {
    if (!payables) return { total: 0, pending: 0, completed: 0, commissions: 0, expenses: 0 };
    
    return {
      total: payables.reduce((sum, r) => sum + Number(r.net_amount), 0),
      pending: payables
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.net_amount), 0),
      completed: payables
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.net_amount), 0),
      commissions: payables
        .filter(r => r.transaction_type === 'commission')
        .reduce((sum, r) => sum + Number(r.net_amount), 0),
      expenses: payables
        .filter(r => r.transaction_type === 'expense')
        .reduce((sum, r) => sum + Number(r.net_amount), 0)
    };
  }, [payables]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Pago', className: 'bg-green-100 text-green-700 border-green-300' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' }
    };

    const config = variants[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      expense: 'Despesa',
      commission: 'Comissão'
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      debit_card: 'Débito',
      credit_card: 'Crédito',
      pix: 'PIX',
      bank_transfer: 'Transferência'
    };
    return labels[method] || method;
  };

  const handleMarkAsPaid = (recordId: string) => {
    if (window.confirm('Tem certeza que deseja marcar esta comissão como paga?')) {
      markAsPaidMutation.mutate(recordId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              R$ {totals.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Contas a Pagar */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Despesas e Comissões Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables && payables.length > 0 ? (
                  payables.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {record.transaction_number}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className={
                          record.transaction_type === 'commission' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                        }>
                          {getTypeLabel(record.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {record.description}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {record.category.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(record.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.payment_records && record.payment_records.length > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {getPaymentMethodLabel(record.payment_records[0].payment_method)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        R$ {record.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.transaction_type === 'commission' && record.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={() => handleMarkAsPaid(record.id)}
                            disabled={markAsPaidMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      Nenhuma despesa ou comissão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
