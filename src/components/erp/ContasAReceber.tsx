import React, { useState, useMemo } from 'react';
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

// Using database schema directly
interface FinancialRecord {
  id: string;
  transaction_type: string;
  category: string | null;
  subcategory: string | null;
  amount: number;
  net_amount: number | null;
  status: string | null;
  description: string | null;
  transaction_date: string;
  created_at: string | null;
  payment_date: string | null;
  notes: string | null;
}

export const ContasAReceber: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { syncToCashFlowAsync } = useCashFlowSync();

  const { data: receivables, isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'revenue')
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (recordId: string) => {
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
          payment_date: paymentDate,
          updated_at: paymentDate,
        })
        .eq('id', recordId);

      if (error) throw error;

      await syncToCashFlowAsync({
        financialRecordId: recordId,
        transactionType: 'revenue',
        amount: record.net_amount || record.amount,
        description: record.description || '',
        category: record.category || 'other',
        paymentMethod: 'other',
        transactionDate: record.transaction_date,
        metadata: {}
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
      const netAmount = values.amount - (values.discount_amount || 0);

      const { error } = await supabase.from('financial_records').insert({
        transaction_type: 'revenue',
        category: values.category,
        subcategory: values.subcategory,
        amount: values.amount,
        net_amount: netAmount,
        status: values.status,
        description: values.description,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        payment_date: values.status === 'completed' ? new Date().toISOString() : null,
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
      const netAmount = values.amount - (values.discount_amount || 0);

      const { error } = await supabase
        .from('financial_records')
        .update({
          category: values.category,
          subcategory: values.subcategory,
          amount: values.amount,
          net_amount: netAmount,
          status: values.status,
          description: values.description,
          transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
          payment_date: values.status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (values.status === 'completed') {
        await syncToCashFlowAsync({
          financialRecordId: id,
          transactionType: 'revenue',
          amount: netAmount,
          description: values.description,
          category: values.category,
          paymentMethod: 'other',
          transactionDate: format(values.transaction_date, 'yyyy-MM-dd'),
          metadata: {}
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
      amount: record.amount,
      description: record.description,
      transaction_date: new Date(record.transaction_date),
      status: record.status,
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
  const totals = useMemo(() => {
    if (!receivables) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: receivables.reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0),
      pending: receivables
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0),
      completed: receivables
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0)
    };
  }, [receivables]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Recebido', className: 'bg-green-100 text-green-700 border-green-300' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' }
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
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
            <CardHeader className="pb-2">
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

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Receitas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {receivables && receivables.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(parseISO(record.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.description || '-'}
                        </TableCell>
                        <TableCell>
                          {record.category || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(record.net_amount || record.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {record.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleMarkAsPaid(record.id)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(record)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma receita encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <RevenueRecordForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          initialData={editingRecord}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => recordToDelete && deleteMutation.mutate(recordToDelete)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta receita como recebida? A data de recebimento será registrada como hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayment} className="bg-green-600 hover:bg-green-700">
              Confirmar Recebimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
