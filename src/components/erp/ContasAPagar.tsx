import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, Loader2, DollarSign, CheckCircle, Plus, Pencil, Trash2, CheckCircle2, CheckSquare, Filter, Users, Calendar, CreditCard } from 'lucide-react';
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
  barber_id: string | null;
  barber_name: string | null;
  notes: string | null;
}

export const ContasAPagar: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [batchPaymentDialogOpen, setBatchPaymentDialogOpen] = useState(false);
  
  // Filtros
  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  
  const queryClient = useQueryClient();
  const { syncToCashFlowAsync } = useCashFlowSync();

  // Buscar lista de barbeiros
  const { data: barbers } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: payables, isLoading } = useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .in('transaction_type', ['expense', 'commission'])
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  // Aplicar filtros
  const filteredPayables = useMemo(() => {
    if (!payables) return [];
    
    return payables.filter(record => {
      if (filterBarber !== 'all' && record.barber_id !== filterBarber) {
        return false;
      }
      if (filterCategory !== 'all' && record.category !== filterCategory) {
        return false;
      }
      if (filterStatus !== 'all' && record.status !== filterStatus) {
        return false;
      }
      if (filterDateStart && record.transaction_date < filterDateStart) {
        return false;
      }
      if (filterDateEnd && record.transaction_date > filterDateEnd) {
        return false;
      }
      return true;
    });
  }, [payables, filterBarber, filterCategory, filterStatus, filterDateStart, filterDateEnd]);

  // Categorias únicas para filtro
  const uniqueCategories = useMemo(() => {
    if (!payables) return [];
    const cats = new Set(payables.map(r => r.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [payables]);

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

      // Sync with barber_commissions if it's a commission
      if (record.transaction_type === 'commission' && record.barber_id) {
        await supabase
          .from('barber_commissions')
          .update({ 
            status: 'paid',
            payment_date: paymentDate,
          })
          .eq('barber_id', record.barber_id);
      }

      await syncToCashFlowAsync({
        financialRecordId: recordId,
        transactionType: record.transaction_type as 'expense' | 'commission',
        amount: record.net_amount || record.amount,
        description: record.description || '',
        category: record.category || 'other',
        paymentMethod: 'other',
        transactionDate: record.transaction_date,
        metadata: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Pagamento registrado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como paga', { description: error.message });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const netAmount = values.amount - (values.discount_amount || 0);

      const { error } = await supabase.from('financial_records').insert({
        transaction_type: values.transaction_type || 'expense',
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
      const netAmount = values.amount - (values.discount_amount || 0);
      const paymentDate = values.status === 'completed' ? new Date().toISOString() : null;

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
          payment_date: paymentDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (values.status === 'completed') {
        await syncToCashFlowAsync({
          financialRecordId: id,
          transactionType: values.transaction_type || 'expense',
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
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Lançamento atualizado!');
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
      toast.success('Lançamento excluído!');
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

  // Seleção múltipla
  const pendingFilteredRecords = useMemo(() => {
    return filteredPayables.filter(r => r.status === 'pending');
  }, [filteredPayables]);

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(recordId);
      } else {
        newSet.delete(recordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(pendingFilteredRecords.map(r => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const selectedTotal = useMemo(() => {
    return filteredPayables
      .filter(r => selectedRecords.has(r.id))
      .reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0);
  }, [filteredPayables, selectedRecords]);

  // Pagamento em lote
  const batchPayMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const paymentDate = new Date().toISOString();
      
      for (const recordId of recordIds) {
        const { error } = await supabase
          .from('financial_records')
          .update({ 
            status: 'completed',
            payment_date: paymentDate,
            updated_at: paymentDate,
          })
          .eq('id', recordId);

        if (error) {
          console.error('Erro ao atualizar registro:', error);
        }
      }

      return { successCount: recordIds.length, totalCount: recordIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      toast.success(`${selectedRecords.size} pagamentos registrados com sucesso!`);
      setSelectedRecords(new Set());
      setBatchPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Erro no pagamento em lote:', error);
      toast.error('Erro ao processar pagamentos', { description: error.message });
    }
  });

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
    if (!filteredPayables) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: filteredPayables.reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0),
      pending: filteredPayables
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0),
      completed: filteredPayables
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0)
    };
  }, [filteredPayables]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Pago', className: 'bg-green-100 text-green-700 border-green-300' },
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

  const getTypeBadge = (type: string) => {
    if (type === 'commission') {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Comissão</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 border-red-300">Despesa</Badge>;
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
          <h2 className="text-xl sm:text-2xl font-bold">Contas a Pagar</h2>
          <div className="flex gap-2">
            {selectedRecords.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setBatchPaymentDialogOpen(true)}
                className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Pagar {selectedRecords.size} selecionados
              </Button>
            )}
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Despesa</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Select value={filterBarber} onValueChange={setFilterBarber}>
              <SelectTrigger>
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Barbeiros</SelectItem>
                {barbers?.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Pago</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              type="date" 
              value={filterDateStart} 
              onChange={(e) => setFilterDateStart(e.target.value)}
              placeholder="Data Início"
            />
            
            <Input 
              type="date" 
              value={filterDateEnd} 
              onChange={(e) => setFilterDateEnd(e.target.value)}
              placeholder="Data Fim"
            />
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader className="pb-2">
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
            <CardHeader className="pb-2">
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

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                R$ {totals.completed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedRecords.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedRecords.size} item(s) selecionado(s)
              </span>
              <span className="text-blue-900 font-bold">
                Total: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Despesas e Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayables && filteredPayables.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={pendingFilteredRecords.length > 0 && selectedRecords.size === pendingFilteredRecords.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.status === 'pending' && (
                            <Checkbox 
                              checked={selectedRecords.has(record.id)}
                              onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(record.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getTypeBadge(record.transaction_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.description || '-'}
                        </TableCell>
                        <TableCell>
                          {record.category ? getCategoryLabel(record.category) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.barber_name || '-'}
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
                                <CheckCircle className="h-4 w-4" />
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
                Nenhum lançamento encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <FinancialRecordForm
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
            <AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
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
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar este lançamento como pago? A data de pagamento será registrada como hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayment} className="bg-green-600 hover:bg-green-700">
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Payment Dialog */}
      <AlertDialog open={batchPaymentDialogOpen} onOpenChange={setBatchPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagamento em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Deseja marcar {selectedRecords.size} lançamento(s) como pago(s)?</p>
              <p className="font-bold mt-2">
                Total: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => batchPayMutation.mutate(Array.from(selectedRecords))} 
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Pagamentos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
