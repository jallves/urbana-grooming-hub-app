import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
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

interface PaymentRecord {
  payment_method: string;
}

interface StaffRecord {
  name: string;
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
  barber_id?: string;
  appointment_id?: string;
  staff?: StaffRecord;
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

interface CommissionPayment {
  id: string;
  barber_id: string;
  barber_name: string;
  total_amount: number;
  commission_count: number;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: string;
  notes?: string;
  financial_record_ids: string[];
  created_at: string;
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
  const { syncToCashFlowAsync, isSyncing } = useCashFlowSync();

  // Buscar lista de barbeiros
  const { data: barbers } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('role', 'barber')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

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
        .limit(500);

      if (error) throw error;
      return data as FinancialRecord[];
    },
    refetchInterval: 10000
  });

  // Buscar pagamentos consolidados de comissões
  const { data: commissionPayments, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['commission-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as CommissionPayment[];
    },
    refetchInterval: 10000
  });

  // Aplicar filtros
  const filteredPayables = useMemo(() => {
    if (!payables) return [];
    
    return payables.filter(record => {
      // Filtro por barbeiro
      if (filterBarber !== 'all' && record.barber_id !== filterBarber) {
        return false;
      }
      
      // Filtro por categoria
      if (filterCategory !== 'all' && record.category !== filterCategory) {
        return false;
      }
      
      // Filtro por status
      if (filterStatus !== 'all' && record.status !== filterStatus) {
        return false;
      }
      
      // Filtro por data início
      if (filterDateStart && record.transaction_date < filterDateStart) {
        return false;
      }
      
      // Filtro por data fim
      if (filterDateEnd && record.transaction_date > filterDateEnd) {
        return false;
      }
      
      return true;
    });
  }, [payables, filterBarber, filterCategory, filterStatus, filterDateStart, filterDateEnd]);

  // Categorias únicas para filtro
  const uniqueCategories = useMemo(() => {
    if (!payables) return [];
    const cats = new Set(payables.map(r => r.category));
    return Array.from(cats);
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
          completed_at: paymentDate,
          payment_date: paymentDate,
          updated_at: paymentDate,
        })
        .eq('id', recordId);

      if (error) throw error;

      if (record.transaction_type === 'commission' && record.appointment_id) {
        await supabase
          .from('barber_commissions')
          .update({ 
            status: 'paid',
            payment_date: paymentDate,
            updated_at: paymentDate
          })
          .eq('appointment_id', record.appointment_id)
          .eq('barber_id', record.barber_id);
      }

      const transactionType = record.transaction_type as 'revenue' | 'expense' | 'commission';
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
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Pagamento registrado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como paga', { description: error.message });
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

      if (values.transaction_type === 'commission' && 
          values.status === 'completed' && 
          currentRecord?.status !== 'completed' &&
          currentRecord?.appointment_id &&
          currentRecord?.barber_id) {
        
        await supabase
          .from('barber_commissions')
          .update({ 
            status: 'paid',
            payment_date: paymentDate,
            updated_at: paymentDate
          })
          .eq('appointment_id', currentRecord.appointment_id)
          .eq('barber_id', currentRecord.barber_id);
      }

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
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
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
      .reduce((sum, r) => sum + Number(r.net_amount), 0);
  }, [filteredPayables, selectedRecords]);

  // Pagamento em lote com criação de registro consolidado
  const batchPayMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const paymentDate = new Date().toISOString();
      
      // Buscar todos os registros selecionados
      const { data: records, error: fetchError } = await supabase
        .from('financial_records')
        .select('*, staff:barber_id(name)')
        .in('id', recordIds);

      if (fetchError) throw fetchError;
      if (!records || records.length === 0) throw new Error('Nenhum registro encontrado');

      // Agrupar por barbeiro para comissões
      const commissionsByBarber = new Map<string, {
        barberId: string;
        barberName: string;
        records: typeof records;
        total: number;
        dates: string[];
      }>();

      for (const record of records) {
        // Atualizar status
        const { error } = await supabase
          .from('financial_records')
          .update({ 
            status: 'completed',
            completed_at: paymentDate,
            payment_date: paymentDate,
            updated_at: paymentDate,
          })
          .eq('id', record.id);

        if (error) {
          console.error('Erro ao atualizar registro:', error);
          continue;
        }

        // Sincronizar com barber_commissions se for comissão
        if (record.transaction_type === 'commission' && record.appointment_id) {
          await supabase
            .from('barber_commissions')
            .update({ 
              status: 'paid',
              payment_date: paymentDate,
              updated_at: paymentDate
            })
            .eq('appointment_id', record.appointment_id)
            .eq('barber_id', record.barber_id);

          // Agrupar para registro consolidado
          if (record.barber_id) {
            const existing = commissionsByBarber.get(record.barber_id);
            const anyRecord = record as any;
            const barberName = anyRecord.staff?.name || 'Barbeiro';
            
            if (existing) {
              existing.records.push(record);
              existing.total += Number(record.net_amount);
              existing.dates.push(record.transaction_date);
            } else {
              commissionsByBarber.set(record.barber_id, {
                barberId: record.barber_id,
                barberName: barberName,
                records: [record],
                total: Number(record.net_amount),
                dates: [record.transaction_date]
              });
            }
          }
        }

        // Sincronizar com fluxo de caixa
        const transactionType = record.transaction_type as 'revenue' | 'expense' | 'commission';
        const metadata = typeof record.metadata === 'object' && record.metadata !== null 
          ? record.metadata as Record<string, any>
          : {};

        await syncToCashFlowAsync({
          financialRecordId: record.id,
          transactionType: transactionType,
          amount: record.net_amount,
          description: record.description,
          category: record.category,
          paymentMethod: metadata?.payment_method || 'other',
          transactionDate: record.transaction_date,
          metadata: metadata
        });
      }

      // Criar registros consolidados para cada barbeiro
      for (const [barberId, data] of commissionsByBarber) {
        const sortedDates = data.dates.sort();
        const periodStart = sortedDates[0];
        const periodEnd = sortedDates[sortedDates.length - 1];

        const { error: insertError } = await supabase
          .from('commission_payments')
          .insert({
            barber_id: barberId,
            barber_name: data.barberName,
            total_amount: data.total,
            commission_count: data.records.length,
            period_start: periodStart,
            period_end: periodEnd,
            payment_date: paymentDate,
            status: 'paid',
            financial_record_ids: data.records.map(r => r.id)
          });

        if (insertError) {
          console.error('Erro ao criar pagamento consolidado:', insertError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['commission-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success(`${selectedRecords.size} pagamentos registrados!`);
      setSelectedRecords(new Set());
      setBatchPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao processar pagamentos', { description: error.message });
    }
  });

  const handleBatchPayment = () => {
    if (selectedRecords.size === 0) {
      toast.error('Selecione pelo menos um registro');
      return;
    }
    setBatchPaymentDialogOpen(true);
  };

  const confirmBatchPayment = () => {
    batchPayMutation.mutate(Array.from(selectedRecords));
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 text-[10px]">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Pendente</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'commission' ? 'Comissão' : 'Despesa';
  };

  const getBarberName = (record: FinancialRecord) => {
    if (record.staff?.name) {
      return record.staff.name;
    }
    // Extrair do description se for comissão
    if (record.transaction_type === 'commission' && record.description.includes('Barbeiro')) {
      const match = record.description.match(/Barbeiro\s+(.+)/);
      return match ? match[1] : '-';
    }
    return '-';
  };

  const clearFilters = () => {
    setFilterBarber('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const totals = useMemo(() => {
    const pending = filteredPayables.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.net_amount), 0);
    const paid = filteredPayables.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.net_amount), 0);
    return { pending, paid, total: pending + paid };
  }, [filteredPayables]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="lancamentos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-auto p-1 bg-gray-100">
          <TabsTrigger 
            value="lancamentos" 
            className="text-sm py-2.5 bg-amber-100 text-amber-800 border border-amber-200 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900 data-[state=active]:border-amber-300 data-[state=active]:shadow-sm"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger 
            value="comissoes" 
            className="text-sm py-2.5 bg-blue-100 text-blue-800 border border-blue-200 data-[state=active]:bg-blue-200 data-[state=active]:text-blue-900 data-[state=active]:border-blue-300 data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Comissões Pagas
          </TabsTrigger>
        </TabsList>

        {/* Aba Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <p className="text-xs text-yellow-700">Pendente</p>
                <p className="text-lg font-bold text-yellow-700">
                  R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <p className="text-xs text-green-700">Pago</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3">
                <p className="text-xs text-gray-700">Total</p>
                <p className="text-lg font-bold text-gray-700">
                  R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Filtros</span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
                  Limpar
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <Select value={filterBarber} onValueChange={setFilterBarber}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Barbeiros</SelectItem>
                    {barbers?.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 text-xs">
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
                  <SelectTrigger className="h-8 text-xs">
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
                  className="h-8 text-xs"
                  placeholder="Data início"
                />

                <Input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Data fim"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações em lote */}
          {selectedRecords.size > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{selectedRecords.size}</span> selecionado(s) • 
                    <span className="font-bold text-green-700 ml-1">
                      R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleBatchPayment}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={batchPayMutation.isPending}
                  >
                    {batchPayMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    )}
                    Pagar Selecionados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Lançamentos */}
          <Card className="border-gray-200">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  Contas a Pagar ({filteredPayables.length})
                </CardTitle>
                <Button size="sm" onClick={() => setFormOpen(true)} className="h-8 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              {filteredPayables.length > 0 ? (
                <>
                  {/* Layout Mobile em Cards */}
                  <div className="block lg:hidden space-y-3">
                    {filteredPayables.map((record) => (
                      <div key={record.id} className={`bg-gray-50 border rounded-lg p-3 space-y-3 ${selectedRecords.has(record.id) ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 whitespace-nowrap font-medium ${
                                record.transaction_type === 'commission' 
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200' 
                                  : 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200'
                              }`}>
                                {record.transaction_type === 'commission' ? '💰' : '📋'} {getTypeLabel(record.transaction_type)}
                              </Badge>
                              {record.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Pago
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5">
                                  ⏳ Pendente
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm text-gray-900 line-clamp-2">
                              {record.description}
                            </p>
                          </div>
                        </div>

                        {/* Metadados */}
                        <div className="space-y-1.5">
                          {getBarberName(record) !== '-' && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="text-purple-600">👤</span> {getBarberName(record)}
                            </p>
                          )}
                          {record.metadata?.service_name && (
                            <p className="text-xs text-gray-600">
                              🔧 {record.metadata.service_name}
                            </p>
                          )}
                          {record.metadata?.product_name && (
                            <p className="text-xs text-gray-600">
                              📦 {record.metadata.product_name}
                            </p>
                          )}
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-600">Categoria</p>
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] mt-1">
                              📁 {getCategoryLabel(record.category)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Data</p>
                            <p className="text-sm font-medium text-gray-700">
                              {format(parseISO(record.transaction_date + 'T00:00:00'), 'dd/MM/yy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        {/* Valor */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600">Valor</p>
                            <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 text-sm px-3 py-1 font-bold">
                              R$ {record.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          {record.status === 'pending' && (
                            <Checkbox
                              checked={selectedRecords.has(record.id)}
                              onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                              className="border-green-400 data-[state=checked]:bg-green-600"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="flex-1"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Layout Desktop em Tabela */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table className="text-xs w-full">
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="p-2 w-[70px]">Tipo</TableHead>
                          <TableHead className="p-2 min-w-[200px]">Descrição</TableHead>
                          <TableHead className="p-2 w-[140px]">Barbeiro</TableHead>
                          <TableHead className="p-2 w-[150px]">Categoria</TableHead>
                          <TableHead className="p-2 w-[80px]">Data</TableHead>
                          <TableHead className="p-2 w-[90px] text-right">Valor</TableHead>
                          <TableHead className="p-2 w-[60px] text-center">Status</TableHead>
                          <TableHead className="p-2 w-[90px] text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayables.map((record) => (
                          <TableRow 
                            key={record.id}
                            className={selectedRecords.has(record.id) ? 'bg-green-50' : ''}
                          >
                            <TableCell className="p-2">
                              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 whitespace-nowrap font-medium ${
                                record.transaction_type === 'commission' 
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200' 
                                  : 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200'
                              }`}>
                                {record.transaction_type === 'commission' ? '💰' : '📋'} {getTypeLabel(record.transaction_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-gray-900 truncate" title={record.description}>
                                  {record.description}
                                </span>
                                {record.metadata?.service_name && (
                                  <span className="text-[10px] text-gray-500">
                                    🔧 {record.metadata.service_name}
                                  </span>
                                )}
                                {record.metadata?.product_name && (
                                  <span className="text-[10px] text-gray-500">
                                    📦 {record.metadata.product_name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              {getBarberName(record) !== '-' ? (
                                <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5 font-medium">
                                  👤 {getBarberName(record)}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Badge variant="outline" className="bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200 text-[10px] px-2 py-0.5">
                                📁 {getCategoryLabel(record.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2">
                              <Badge variant="outline" className="bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-700 border-cyan-200 text-[10px] px-2 py-0.5">
                                📅 {format(parseISO(record.transaction_date + 'T00:00:00'), 'dd/MM/yy', { locale: ptBR })}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2 text-right">
                              <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 text-xs px-2 py-0.5 font-bold">
                                R$ {record.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2 text-center">
                              {record.status === 'completed' ? (
                                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 text-[10px] px-2 py-0.5">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Pago
                                </Badge>
                              ) : (
                                <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 text-[10px] px-2 py-0.5">
                                  ⏳ Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="p-2 text-center">
                              <div className="flex justify-center items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-blue-50"
                                  onClick={() => handleEdit(record)}
                                >
                                  <Pencil className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-red-50"
                                  onClick={() => handleDelete(record.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                                {record.status === 'pending' ? (
                                  <Checkbox
                                    checked={selectedRecords.has(record.id)}
                                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                                    className="ml-1 border-green-400 data-[state=checked]:bg-green-600"
                                  />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-1" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Nenhum registro encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Comissões Pagas */}
        <TabsContent value="comissoes" className="space-y-4">
          <Card className="border-gray-200">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Pagamentos de Comissões Consolidados
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Registro consolidado de pagamentos de comissões por barbeiro
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCommissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : commissionPayments && commissionPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="p-2">Barbeiro</TableHead>
                        <TableHead className="p-2 w-20 text-center">Qtd.</TableHead>
                        <TableHead className="p-2 w-28 text-right">Valor Total</TableHead>
                        <TableHead className="p-2 w-24">Período</TableHead>
                        <TableHead className="p-2 w-28">Data Pagamento</TableHead>
                        <TableHead className="p-2 w-16 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="p-2 font-medium">
                            {payment.barber_name}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {payment.commission_count} comissões
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-right font-bold text-green-700">
                            R$ {payment.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="p-2 text-[10px]">
                            {format(parseISO(payment.period_start), 'dd/MM', { locale: ptBR })} - {format(parseISO(payment.period_end), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="p-2 text-[10px]">
                            {format(parseISO(payment.payment_date), 'dd/MM/yy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Badge className="bg-green-100 text-green-700 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Nenhum pagamento consolidado registrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              Tem certeza que deseja excluir este lançamento?
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
              Marcar como pago? Será registrado no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchPaymentDialogOpen} onOpenChange={setBatchPaymentDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Pagamento em Lote
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Pagar <strong>{selectedRecords.size}</strong> lançamento(s)?</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Total:</strong> R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Comissões serão agrupadas por barbeiro na aba "Comissões Pagas".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchPayMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchPayment}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={batchPayMutation.isPending}
            >
              {batchPayMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
