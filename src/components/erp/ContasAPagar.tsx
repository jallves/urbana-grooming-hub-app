import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, Loader2, DollarSign, CheckCircle, CreditCard, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCashFlowSync } from '@/hooks/financial/useCashFlowSync';
import FinancialRecordForm from './FinancialRecordForm';
import { getCategoryLabel } from '@/utils/categoryMappings';
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
}

interface FinancialRecord {
  id: string;
  transaction_number: string;
  transaction_type: string;
  category: string;
  subcategory?: string;
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  status: string;
  description: string;
  transaction_date: string;
  created_at: string;
  payment_date?: string;
  payment_records: PaymentRecord[];
  metadata?: {
    service_name?: string;
    product_name?: string;
    commission_rate?: number;
    service_amount?: number;
    payment_time?: string;
    payment_method?: string;
    notes?: string;
    [key: string]: any;
  };
}

export const ContasAPagar: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { syncToCashFlowAsync, isSyncing } = useCashFlowSync();

  // 🔄 SINCRONIZAÇÃO AUTOMÁTICA de comissões pendentes do barber_commissions para financial_records
  React.useEffect(() => {
    const syncPendingCommissions = async () => {
      try {
        console.log('🔄 Verificando comissões pendentes para sincronizar...');
        
        // Buscar comissões pendentes que não estão no financial_records
        const { data: pendingCommissions, error: fetchError } = await supabase
          .from('barber_commissions')
          .select('*')
          .eq('status', 'pending');

        if (fetchError) {
          console.error('❌ Erro ao buscar comissões pendentes:', fetchError);
          return;
        }

        if (!pendingCommissions || pendingCommissions.length === 0) {
          console.log('✅ Nenhuma comissão pendente para sincronizar');
          return;
        }

        console.log(`📊 Encontradas ${pendingCommissions.length} comissões pendentes`);

        // Para cada comissão pendente, verificar se já existe no financial_records
        for (const commission of pendingCommissions) {
          // Verificar se já existe
          const { data: existing } = await supabase
            .from('financial_records')
            .select('id')
            .eq('transaction_type', 'commission')
            .eq('barber_id', commission.barber_id)
            .eq('appointment_id', commission.appointment_id)
            .maybeSingle();

          if (existing) {
            console.log(`⏭️ Comissão ${commission.id} já existe no financial_records`);
            continue;
          }

          // Criar no financial_records
          const transactionNumber = `COM-MIG-${format(new Date(commission.created_at), 'yyyyMMdd')}-${commission.id.substring(0, 6)}`;
          
          const { error: insertError } = await supabase
            .from('financial_records')
            .insert({
              transaction_number: transactionNumber,
              transaction_type: 'commission',
              category: 'staff_payments',
              description: `Comissão ${commission.commission_type || 'de serviço'}`,
              gross_amount: commission.amount,
              net_amount: commission.amount,
              status: 'pending',
              transaction_date: new Date(commission.created_at).toISOString().split('T')[0],
              barber_id: commission.barber_id,
              appointment_id: commission.appointment_id,
              created_at: commission.created_at,
            });

          if (insertError) {
            console.error(`❌ Erro ao inserir comissão ${commission.id}:`, insertError);
          } else {
            console.log(`✅ Comissão ${commission.id} sincronizada com sucesso`);
          }
        }

        // Atualizar as queries para mostrar os novos dados
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
        queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
        
        console.log('✅ Sincronização de comissões concluída');
      } catch (error) {
        console.error('❌ Erro na sincronização de comissões:', error);
      }
    };

    syncPendingCommissions();
  }, [queryClient]);

  const { data: payables, isLoading } = useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          payment_records(payment_method),
          staff:barber_id(name)
        `)
        .in('transaction_type', ['expense', 'commission'])
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Concatenar nome do barbeiro na descrição quando for comissão
      const processed = data?.map(record => {
        const anyRecord = record as any;
        if (record.transaction_type === 'commission' && anyRecord.staff && anyRecord.staff.name) {
          return {
            ...record,
            description: `Comissão do Barbeiro ${anyRecord.staff.name}`
          };
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

      // 🔄 SINCRONIZAÇÃO COM BARBER_COMMISSIONS (se for comissão)
      if (record.transaction_type === 'commission' && record.appointment_id) {
        console.log('🔄 Sincronizando comissão com barber_commissions...', { 
          appointment_id: record.appointment_id,
          barber_id: record.barber_id 
        });

        // Atualizar status na tabela barber_commissions
        const { error: commissionError } = await supabase
          .from('barber_commissions')
          .update({ 
            status: 'paid',
            payment_date: paymentDate,
            updated_at: paymentDate
          })
          .eq('appointment_id', record.appointment_id)
          .eq('barber_id', record.barber_id);

        if (commissionError) {
          console.error('⚠️ Erro ao sincronizar com barber_commissions:', commissionError);
        } else {
          console.log('✅ Comissão sincronizada com barber_commissions');
        }
      }

      // 🔄 INTEGRAÇÃO COM FLUXO DE CAIXA
      const transactionType = (record.transaction_type === 'revenue' || 
                               record.transaction_type === 'expense' || 
                               record.transaction_type === 'commission') 
                               ? record.transaction_type 
                               : 'expense';
      
      const metadata = typeof record.metadata === 'object' && record.metadata !== null 
        ? record.metadata as Record<string, any>
        : {};

      await syncToCashFlowAsync({
        financialRecordId: recordId,
        transactionType: transactionType,
        amount: record.net_amount,
        description: record.description,
        category: record.category,
        paymentMethod: metadata?.payment_method || 'other',
        transactionDate: record.transaction_date,
        metadata: metadata
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] }); // Atualizar painel dos barbeiros
      toast.success('Pagamento registrado e sincronizado com o painel dos barbeiros!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como paga', {
        description: error.message
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const netAmount = values.gross_amount - (values.discount_amount || 0) - (values.tax_amount || 0);
      const transactionNumber = values.transaction_type === 'commission' 
        ? 'COM-' + Date.now() 
        : 'EXP-' + Date.now();

      const paymentDate = values.status === 'completed' ? new Date().toISOString() : null;

      const { error } = await supabase.from('financial_records').insert({
        transaction_number: transactionNumber,
        transaction_type: values.transaction_type,
        category: values.category,
        subcategory: values.subcategory,
        gross_amount: values.gross_amount,
        discount_amount: values.discount_amount || 0,
        tax_amount: values.tax_amount || 0,
        net_amount: netAmount,
        status: values.status,
        description: values.description,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        completed_at: paymentDate,
        payment_date: paymentDate,
        metadata: {
          payment_method: values.payment_method,
          notes: values.notes,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Lançamento criado com sucesso!');
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar lançamento', { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const netAmount = values.gross_amount - (values.discount_amount || 0) - (values.tax_amount || 0);
      const paymentDate = values.status === 'completed' ? new Date().toISOString() : null;

      // Buscar o registro atual antes de atualizar
      const { data: currentRecord } = await supabase
        .from('financial_records')
        .select('*')
        .eq('id', id)
        .single();

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
          completed_at: paymentDate,
          payment_date: paymentDate,
          metadata: {
            payment_method: values.payment_method,
            notes: values.notes,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // 🔄 SINCRONIZAÇÃO COM BARBER_COMMISSIONS (se for comissão e mudou para 'completed')
      if (values.transaction_type === 'commission' && 
          values.status === 'completed' && 
          currentRecord?.status !== 'completed' &&
          currentRecord?.appointment_id &&
          currentRecord?.barber_id) {
        
        console.log('🔄 Sincronizando comissão editada com barber_commissions...', { 
          appointment_id: currentRecord.appointment_id,
          barber_id: currentRecord.barber_id 
        });

        const { error: commissionError } = await supabase
          .from('barber_commissions')
          .update({ 
            status: 'paid',
            payment_date: paymentDate,
            updated_at: paymentDate
          })
          .eq('appointment_id', currentRecord.appointment_id)
          .eq('barber_id', currentRecord.barber_id);

        if (commissionError) {
          console.error('⚠️ Erro ao sincronizar com barber_commissions:', commissionError);
        } else {
          console.log('✅ Comissão editada sincronizada com barber_commissions');
        }
      }

      // 🔄 INTEGRAÇÃO COM FLUXO DE CAIXA
      // Se foi marcado como pago, sincronizar automaticamente com o fluxo de caixa
      if (values.status === 'completed') {
        await syncToCashFlowAsync({
          financialRecordId: id,
          transactionType: values.transaction_type,
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
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] }); // Atualizar painel dos barbeiros
      toast.success('Lançamento atualizado e sincronizado com o painel dos barbeiros!');
      setFormOpen(false);
      setEditingRecord(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar lançamento', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Lançamento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir lançamento', { description: error.message });
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
      payment_method: record.payment_records?.[0]?.payment_method || record.metadata?.payment_method,
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
      debit: 'Débito',
      credit: 'Crédito',
      pix: 'PIX',
      transfer: 'Transferência'
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
          <h2 className="text-xl sm:text-2xl font-bold">Contas a Pagar</h2>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700 flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Total a Pagar</span>
                <span className="sm:hidden">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-red-700">
                R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700 flex items-center gap-1 sm:gap-2">
                <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-yellow-700">
                R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 flex items-center gap-1 sm:gap-2">
                <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Comissões</span>
                <span className="sm:hidden">Comis.</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-blue-700">
                R$ {totals.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 flex items-center gap-1 sm:gap-2">
                <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold text-orange-700">
                R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas a Pagar */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Despesas e Comissões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-3 lg:p-6">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Número</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Tipo</TableHead>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Descrição</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Categoria</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Data Trans.</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Data Pag.</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Valor</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-center whitespace-nowrap hidden xl:table-cell">Fluxo</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Ações</TableHead>
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
                        <TableCell className="max-w-xs text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{record.description}</span>
                            {record.metadata?.service_name && (
                              <span className="text-xs text-muted-foreground">
                                🔧 Serviço: {record.metadata.service_name}
                              </span>
                            )}
                            {record.metadata?.commission_rate && (
                              <span className="text-xs text-muted-foreground">
                                💰 Taxa: {record.metadata.commission_rate}%
                              </span>
                            )}
                            {record.metadata?.service_amount && (
                              <span className="text-xs text-muted-foreground">
                                💵 Valor base: R$ {Number(record.metadata.service_amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {getCategoryLabel(record.category)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(record.transaction_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.payment_date ? (
                            <span className="text-green-700 font-medium">
                              {format(new Date(record.payment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
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
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
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
                      <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                        Nenhuma despesa ou comissão encontrada
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

      <FinancialRecordForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
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

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirmar Pagamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar este lançamento como pago? Esta ação será registrada no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
