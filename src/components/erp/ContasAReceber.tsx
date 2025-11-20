import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, Loader2, DollarSign, Plus, Pencil, Trash2, CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCashFlowSync } from '@/hooks/financial/useCashFlowSync';
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

interface PaymentRecord {
  payment_method: string;
  payment_date?: string;
}

interface FinancialRecord {
  id: string;
  transaction_number: string;
  category: string;
  subcategory?: string;
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  status: string;
  description: string;
  transaction_date: string;
  transaction_type: string;
  created_at: string;
  payment_date?: string;
  completed_at?: string;
  payment_records: PaymentRecord[];
  metadata?: {
    service_name?: string;
    product_name?: string;
    payment_time?: string;
    payment_method?: string;
    notes?: string;
    [key: string]: any;
  };
}

export const ContasAReceber: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { syncToCashFlowAsync, isSyncing } = useCashFlowSync();

  const { data: receivables, isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          payment_records(payment_method, payment_date)
        `)
        .eq('transaction_type', 'revenue')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Processar para garantir que o payment_method do metadata seja usado quando não houver payment_records
      const processed = data?.map(record => {
        if ((!record.payment_records || record.payment_records.length === 0) && record.metadata) {
          const metadata = typeof record.metadata === 'object' && record.metadata !== null 
            ? record.metadata as Record<string, any>
            : {};
          
          // Criar um payment_record virtual do metadata se existir
          if (metadata.payment_method) {
            return {
              ...record,
              payment_records: [{
                payment_method: metadata.payment_method,
                payment_date: record.payment_date || record.completed_at
              }]
            };
          }
        }
        return record;
      });
      
      return processed as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (recordId: string) => {
      // Buscar o registro para sincronizar
      const { data: record, error: fetchError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError) throw fetchError;

      const paymentDate = new Date().toISOString();

      const { error } = await supabase
        .from('financial_records')
        .update({ 
          status: 'completed',
          completed_at: paymentDate,
          payment_date: paymentDate,
          updated_at: paymentDate,
        })
        .eq('id', recordId);

      if (error) throw error;

      // 🔄 INTEGRAÇÃO COM FLUXO DE CAIXA
      const metadata = typeof record.metadata === 'object' && record.metadata !== null 
        ? record.metadata as Record<string, any>
        : {};

      await syncToCashFlowAsync({
        financialRecordId: recordId,
        transactionType: 'revenue',
        amount: record.net_amount,
        description: record.description,
        category: record.category,
        paymentMethod: metadata?.payment_method || 'other',
        transactionDate: record.transaction_date,
        metadata: metadata
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      toast.success('Recebimento registrado e sincronizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como recebido', {
        description: error.message
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const netAmount = values.gross_amount - (values.discount_amount || 0) - (values.tax_amount || 0);
      const transactionNumber = 'TRX-' + Date.now();

      const { error } = await supabase.from('financial_records').insert({
        transaction_number: transactionNumber,
        transaction_type: 'revenue',
        category: values.category,
        subcategory: values.subcategory,
        gross_amount: values.gross_amount,
        discount_amount: values.discount_amount || 0,
        tax_amount: values.tax_amount || 0,
        net_amount: netAmount,
        status: values.status,
        description: values.description,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        completed_at: values.status === 'completed' ? new Date().toISOString() : null,
        metadata: {
          payment_method: values.payment_method,
          notes: values.notes,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Receita criada com sucesso!');
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar receita', { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const netAmount = values.gross_amount - (values.discount_amount || 0) - (values.tax_amount || 0);

      const { error } = await supabase
        .from('financial_records')
        .update({
          category: values.category,
          subcategory: values.subcategory,
          gross_amount: values.gross_amount,
          discount_amount: values.discount_amount || 0,
          tax_amount: values.tax_amount || 0,
          net_amount: netAmount,
          status: values.status,
          description: values.description,
          transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
          completed_at: values.status === 'completed' ? new Date().toISOString() : null,
          metadata: {
            payment_method: values.payment_method,
            notes: values.notes,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // 🔄 INTEGRAÇÃO COM FLUXO DE CAIXA
      // Se a receita foi marcada como concluída, sincronizar automaticamente com o fluxo de caixa
      if (values.status === 'completed') {
        await syncToCashFlowAsync({
          financialRecordId: id,
          transactionType: 'revenue',
          amount: netAmount,
          description: values.description,
          category: values.category,
          paymentMethod: values.payment_method,
          transactionDate: format(values.transaction_date, 'yyyy-MM-dd'),
          metadata: {
            payment_method: values.payment_method,
            notes: values.notes,
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      toast.success('Receita atualizada e sincronizada!');
      setFormOpen(false);
      setEditingRecord(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar receita', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Receita excluída com sucesso!');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir receita', { description: error.message });
    },
  });

  const handleMarkAsPaid = (recordId: string) => {
    setRecordToPay(recordId);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (recordToPay) {
      markAsPaidMutation.mutate(recordToPay);
      setPaymentDialogOpen(false);
      setRecordToPay(null);
    }
  };

  const handleEdit = (record: FinancialRecord) => {
    setEditingRecord({
      id: record.id,
      transaction_type: record.transaction_type,
      category: record.category,
      subcategory: record.subcategory,
      gross_amount: record.gross_amount,
      discount_amount: record.discount_amount,
      tax_amount: record.tax_amount,
      description: record.description,
      transaction_date: new Date(record.transaction_date),
      status: record.status,
      payment_method: record.metadata?.payment_method,
      notes: record.metadata?.notes,
    });
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (editingRecord?.id) {
      await updateMutation.mutateAsync({ id: editingRecord.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      debit: 'Cartão Débito',
      credit: 'Cartão Crédito',
      pix: 'PIX',
      transfer: 'Transferência',
      debit_card: 'Cartão Débito',
      credit_card: 'Cartão Crédito',
      bank_transfer: 'Transferência'
    };
    return labels[method] || method;
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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Contas a Receber</h2>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Receita</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Total a Receber</span>
                <span className="sm:hidden">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-green-700">
                R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700 flex items-center gap-1 sm:gap-2">
                <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-yellow-700">
                R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-emerald-700">
                R$ {totals.completed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas a Receber */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Receitas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-3 lg:p-6">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Número</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Descrição</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4 hidden md:table-cell">Categoria</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4 hidden lg:table-cell">Pagamento</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4 hidden lg:table-cell">Data</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4 hidden xl:table-cell">Bruto</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4 hidden xl:table-cell">Desconto</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4">Líquido</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-2 sm:px-4">Status</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-2 sm:px-4 hidden xl:table-cell">Fluxo</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {receivables && receivables.length > 0 ? (
                    receivables.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {record.transaction_number}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{record.description}</span>
                            {record.metadata?.service_name && (
                              <span className="text-xs text-muted-foreground">
                                🔧 {record.metadata.service_name}
                              </span>
                            )}
                            {record.metadata?.product_name && (
                              <span className="text-xs text-muted-foreground">
                                📦 {record.metadata.product_name}
                              </span>
                            )}
                            {record.metadata?.payment_time && (
                              <span className="text-xs text-muted-foreground">
                                ⏰ {format(new Date(record.metadata.payment_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className={
                            record.category === 'services' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-green-50 text-green-700 border-green-200'
                          }>
                            {record.category === 'services' ? '🔧 Serviço' : '📦 Produto'}
                          </Badge>
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
                        <TableCell className="text-sm">
                          {format(parseISO(record.transaction_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
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
                        <TableCell className="text-center">
                          {record.status === 'completed' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Registrado
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {record.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(record.id)}
                                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Marcar como Pago
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-500 py-8">
                        Nenhuma receita encontrada
                      </TableCell>
                    </TableRow>
                  )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RevenueRecordForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta receita como recebida? Esta ação será sincronizada com o fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirmar Recebimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && deleteMutation.mutate(recordToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
