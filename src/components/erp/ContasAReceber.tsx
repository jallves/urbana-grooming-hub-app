import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, Loader2, DollarSign } from 'lucide-react';

interface FinancialRecord {
  id: string;
  transaction_number: string;
  category: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  status: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

export const ContasAReceber: React.FC = () => {
  const { data: receivables, isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'revenue')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  // Calcular totais
  const totals = React.useMemo(() => {
    if (!receivables) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: receivables.reduce((sum, r) => sum + Number(r.net_amount), 0),
      pending: receivables
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.net_amount), 0),
      completed: receivables
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.net_amount), 0)
    };
  }, [receivables]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Recebido', className: 'bg-green-100 text-green-700 border-green-300' },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {totals.completed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Contas a Receber */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Receitas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables && receivables.length > 0 ? (
                  receivables.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {record.transaction_number}
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
                      <TableCell className="text-right text-sm text-gray-600">
                        R$ {record.gross_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {record.discount_amount > 0 ? (
                          `- R$ ${record.discount_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {record.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.status)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      Nenhuma receita encontrada
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
