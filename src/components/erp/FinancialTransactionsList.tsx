import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2 } from 'lucide-react';

// Cores por categoria
const getCategoryColors = (category: string | null): string => {
  if (!category) return 'bg-gray-100 text-gray-700 border-gray-300';
  const colors: Record<string, string> = {
    'services': 'bg-blue-100 text-blue-700 border-blue-300',
    'servico': 'bg-blue-100 text-blue-700 border-blue-300',
    'products': 'bg-purple-100 text-purple-700 border-purple-300',
    'produto': 'bg-purple-100 text-purple-700 border-purple-300',
    'tips': 'bg-amber-100 text-amber-700 border-amber-300',
    'gorjeta': 'bg-amber-100 text-amber-700 border-amber-300',
    'staff_payments': 'bg-teal-100 text-teal-700 border-teal-300',
    'comissao': 'bg-teal-100 text-teal-700 border-teal-300',
  };
  return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
};

// Mapeamento de categorias para português
const getCategoryLabel = (category: string | null): string => {
  if (!category) return '-';
  const map: Record<string, string> = {
    'services': 'Serviço',
    'servico': 'Serviço',
    'products': 'Produto',
    'produto': 'Produto',
    'tips': 'Gorjeta',
    'gorjeta': 'Gorjeta',
    'staff_payments': 'Comissão',
    'comissao': 'Comissão',
  };
  return map[category.toLowerCase()] || category;
};

export const FinancialTransactionsList: React.FC = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000
  });

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' }
    };

    const config = variants[status || 'pending'] || { label: status || 'Pendente', className: 'bg-gray-100 text-gray-700' };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {transactions && transactions.length > 0 ? (
          <>
            {/* Layout em Cards para Mobile/Tablet */}
            <div className="block lg:hidden space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {transaction.transaction_type === 'revenue' ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      ) : transaction.transaction_type === 'expense' ? (
                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      )}
                      <Badge variant="outline" className={`text-xs py-0.5 px-2 ${getCategoryColors(transaction.category)}`}>
                        {getCategoryLabel(transaction.category)}
                      </Badge>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">
                        {transaction.transaction_date && format(parseISO(transaction.transaction_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {transaction.created_at && format(parseISO(transaction.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${
                      transaction.transaction_type === 'revenue' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      R$ {(transaction.net_amount || transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    ID: {transaction.id.substring(0, 12)}
                  </p>
                </div>
              ))}
            </div>

            {/* Layout em Tabela para Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                    <TableHead className="whitespace-nowrap">Categoria</TableHead>
                    <TableHead className="whitespace-nowrap">Descrição</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Valor</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {transaction.id.substring(0, 12)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.transaction_date && format(parseISO(transaction.transaction_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {transaction.created_at && format(parseISO(transaction.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getCategoryColors(transaction.category)}`}>
                          {getCategoryLabel(transaction.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={
                          transaction.transaction_type === 'revenue' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          R$ {(transaction.net_amount || transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Nenhuma transação encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};