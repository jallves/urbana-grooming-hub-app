import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, Loader2, DollarSign, Plus, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import RevenueRecordForm from './RevenueRecordForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Interface para contas_receber (tabela ERP real)
interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  categoria: string | null;
  cliente_id: string | null;
  status: string | null;
  observacoes: string | null;
  transaction_id: string | null; // ID da transação eletrônica (NSU, PIX, etc.)
  created_at: string | null;
  updated_at: string | null;
}

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

// Função auxiliar para formatar horário da transação
const formatTransactionTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm:ss', { locale: ptBR });
  } catch {
    return '-';
  }
};

export const ContasAReceber: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const queryClient = useQueryClient();

  // Query para contas_receber (tabela ERP real com transaction_id)
  const { data: contasReceber, isLoading } = useQuery({
    queryKey: ['contas-receber-erp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ContaReceber[];
    },
  });

  // Realtime subscription para contas_receber
  useEffect(() => {
    const channel = supabase
      .channel('contas-receber-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_receber'
        },
        (payload) => {
          console.log('🔔 [ERP Realtime] Contas a Receber atualizada:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['contas-receber-erp'] });
          
          if (payload.eventType === 'INSERT') {
            toast.success('Nova receita registrada!');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Receita atualizada');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Mapear gross_amount para valor (campo usado pelo RevenueRecordForm)
      const valorFinal = values.gross_amount || values.amount || 0;
      
      const { error } = await supabase.from('contas_receber').insert({
        descricao: values.description,
        valor: valorFinal,
        data_vencimento: format(values.transaction_date, 'yyyy-MM-dd'),
        data_recebimento: values.status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null,
        categoria: values.category,
        status: values.status === 'completed' ? 'recebido' : 'pendente',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber-erp'] });
      toast.success('Receita criada com sucesso!');
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar receita', { description: error.message });
    },
  });

  const handleFormSubmit = async (values: any) => {
    await createMutation.mutateAsync(values);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  // Calcular totais
  const totals = useMemo(() => {
    if (!contasReceber) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: contasReceber.reduce((sum, r) => sum + Number(r.valor), 0),
      pending: contasReceber
        .filter(r => r.status === 'pendente')
        .reduce((sum, r) => sum + Number(r.valor), 0),
      completed: contasReceber
        .filter(r => r.status === 'recebido')
        .reduce((sum, r) => sum + Number(r.valor), 0)
    };
  }, [contasReceber]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      recebido: { label: 'Recebido', className: 'bg-green-100 text-green-700 border-green-300' },
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' }
    };

    const config = variants[status || 'pendente'] || { label: status || 'Pendente', className: 'bg-gray-100 text-gray-700' };

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
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Contas a Receber</h2>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Receita</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Total a Receber</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-green-700">
                R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700 flex items-center gap-1 sm:gap-2">
                <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pendente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-yellow-700">
                R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 col-span-2 md:col-span-1">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Recebido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-emerald-700">
                R$ {totals.completed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas a Receber */}
        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Receitas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-3">
            {contasReceber && contasReceber.length > 0 ? (
              <>
                {/* Layout Mobile/Tablet: Cards - Texto completo sem cortes */}
                <div className="block xl:hidden space-y-3 px-3">
                  {contasReceber.map((conta) => (
                    <div key={conta.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      {/* Categoria + Status (linha superior) */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-xs py-0.5 px-2 ${getCategoryColors(conta.categoria)}`}>
                          {getCategoryLabel(conta.categoria)}
                        </Badge>
                        {getStatusBadge(conta.status)}
                      </div>
                      
                      {/* Descrição - completa, sem cortes */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 block mb-0.5">Descrição</span>
                        <p className="text-sm font-medium text-gray-900">
                          {conta.descricao || '-'}
                        </p>
                      </div>
                      
                      {/* Data e Horário */}
                      <div className="flex flex-wrap gap-4 mb-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Data</span>
                          <span className="text-gray-800">
                            {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Horário</span>
                          <span className="text-gray-800 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTransactionTime(conta.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* ID da Transação - completo */}
                      {conta.transaction_id && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500 block mb-0.5">ID Transação</span>
                          <p className="text-xs font-mono text-gray-600 break-all">
                            {conta.transaction_id}
                          </p>
                        </div>
                      )}
                      
                      {/* Valor */}
                      <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block mb-0.5">Valor</span>
                          <span className="text-lg font-bold text-green-600">
                            R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layout Desktop XL+: Tabela compacta */}
                <div className="hidden xl:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="px-3 text-xs">Data</TableHead>
                        <TableHead className="px-2 text-xs">Hora</TableHead>
                        <TableHead className="px-2 text-xs">Descrição</TableHead>
                        <TableHead className="px-2 text-xs">Categoria</TableHead>
                        <TableHead className="px-2 text-xs text-right">Valor</TableHead>
                        <TableHead className="px-3 text-xs text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasReceber.map((conta) => (
                        <TableRow key={conta.id} className="hover:bg-gray-50">
                          <TableCell className="px-3 py-2 text-xs whitespace-nowrap">
                            {format(parseISO(conta.data_vencimento), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {formatTransactionTime(conta.created_at)}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs max-w-[200px]">
                            <span className="block truncate" title={conta.descricao || '-'}>
                              {conta.descricao || '-'}
                            </span>
                            {conta.transaction_id && (
                              <span className="block text-[10px] font-mono text-gray-500 truncate" title={conta.transaction_id}>
                                ID: {conta.transaction_id.length > 20 ? `${conta.transaction_id.substring(0, 20)}...` : conta.transaction_id}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getCategoryColors(conta.categoria)}`}>
                              {getCategoryLabel(conta.categoria)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs text-right font-semibold text-green-600 whitespace-nowrap">
                            R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center">
                            {getStatusBadge(conta.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 px-3">
                Nenhuma conta a receber encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form para nova receita */}
      <RevenueRecordForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isLoading={createMutation.isPending}
      />
    </>
  );
};
