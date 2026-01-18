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
import { ArrowDownCircle, Loader2, DollarSign, CheckCircle, Plus, CheckCircle2, CheckSquare, Filter } from 'lucide-react';
import { toast } from 'sonner';
import FinancialRecordForm from './FinancialRecordForm';
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

// Interface para contas_pagar (tabela ERP real)
interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string | null;
  fornecedor: string | null;
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

export const ContasAPagar: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [batchPaymentDialogOpen, setBatchPaymentDialogOpen] = useState(false);
  
  // Filtros
  const [filterFornecedor, setFilterFornecedor] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Query para contas_pagar (tabela ERP real com transaction_id)
  const { data: contasPagar, isLoading } = useQuery({
    queryKey: ['contas-pagar-erp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as ContaPagar[];
    },
    refetchInterval: 10000
  });

  // Buscar lista de fornecedores únicos (barbeiros)
  const fornecedores = useMemo(() => {
    if (!contasPagar) return [];
    const forn = new Set(contasPagar.map(r => r.fornecedor).filter(Boolean));
    return Array.from(forn) as string[];
  }, [contasPagar]);

  // Aplicar filtros
  const filteredPayables = useMemo(() => {
    if (!contasPagar) return [];
    
    return contasPagar.filter(record => {
      if (filterFornecedor !== 'all' && record.fornecedor !== filterFornecedor) {
        return false;
      }
      if (filterCategory !== 'all' && record.categoria !== filterCategory) {
        return false;
      }
      if (filterStatus !== 'all' && record.status !== filterStatus) {
        return false;
      }
      if (filterDateStart && record.data_vencimento < filterDateStart) {
        return false;
      }
      if (filterDateEnd && record.data_vencimento > filterDateEnd) {
        return false;
      }
      return true;
    });
  }, [contasPagar, filterFornecedor, filterCategory, filterStatus, filterDateStart, filterDateEnd]);

  // Categorias únicas para filtro
  const uniqueCategories = useMemo(() => {
    if (!contasPagar) return [];
    const cats = new Set(contasPagar.map(r => r.categoria).filter(Boolean));
    return Array.from(cats) as string[];
  }, [contasPagar]);

  const markAsPaidMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const paymentDate = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase
        .from('contas_pagar')
        .update({ 
          status: 'pago',
          data_pagamento: paymentDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-erp'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
      toast.success('Pagamento registrado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como paga', { description: error.message });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from('contas_pagar').insert({
        descricao: values.description,
        valor: values.amount,
        data_vencimento: format(values.transaction_date, 'yyyy-MM-dd'),
        data_pagamento: values.status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null,
        categoria: values.category,
        fornecedor: values.barber_name || null,
        status: values.status === 'completed' ? 'pago' : 'pendente',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-erp'] });
      toast.success('Lançamento criado com sucesso!');
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar lançamento', { description: error.message });
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
    return filteredPayables.filter(r => r.status === 'pendente');
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
      .reduce((sum, r) => sum + Number(r.valor), 0);
  }, [filteredPayables, selectedRecords]);

  // Pagamento em lote
  const batchPayMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const paymentDate = format(new Date(), 'yyyy-MM-dd');
      
      for (const recordId of recordIds) {
        const { error } = await supabase
          .from('contas_pagar')
          .update({ 
            status: 'pago',
            data_pagamento: paymentDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);

        if (error) {
          console.error('Erro ao atualizar registro:', error);
        }
      }

      return { successCount: recordIds.length, totalCount: recordIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-erp'] });
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

  const handleFormSubmit = async (values: any) => {
    await createMutation.mutateAsync(values);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  // Calcular totais
  const totals = useMemo(() => {
    if (!filteredPayables) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: filteredPayables.reduce((sum, r) => sum + Number(r.valor), 0),
      pending: filteredPayables
        .filter(r => r.status === 'pendente')
        .reduce((sum, r) => sum + Number(r.valor), 0),
      completed: filteredPayables
        .filter(r => r.status === 'pago')
        .reduce((sum, r) => sum + Number(r.valor), 0)
    };
  }, [filteredPayables]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      pago: { label: 'Pago', className: 'bg-green-100 text-green-700 border-green-300' },
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
            <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor/Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Fornecedores</SelectItem>
                {fornecedores.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              type="date" 
              placeholder="Data Início"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
            />
            
            <Input 
              type="date" 
              placeholder="Data Fim"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
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

        {/* Seleção e total selecionado */}
        {selectedRecords.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedRecords.size} itens selecionados
              </span>
              <span className="text-blue-900 font-bold text-lg">
                Total: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Contas a Pagar (ERP real com transaction_id) */}
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
                      <TableHead className="whitespace-nowrap">ID Transação</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell>
                          {conta.status === 'pendente' && (
                            <Checkbox
                              checked={selectedRecords.has(conta.id)}
                              onCheckedChange={(checked) => handleSelectRecord(conta.id, !!checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600 whitespace-nowrap">
                          {conta.transaction_id || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {conta.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          {conta.fornecedor || '-'}
                        </TableCell>
                        <TableCell>
                          {getCategoryLabel(conta.categoria)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(conta.status)}</TableCell>
                        <TableCell className="text-right">
                          {conta.status === 'pendente' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(conta.id)}
                              className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conta a pagar encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de pagamento individual */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta despesa como paga? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayment}>
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de pagamento em lote */}
      <AlertDialog open={batchPaymentDialogOpen} onOpenChange={setBatchPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagamento em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar {selectedRecords.size} despesas como pagas?
              <br />
              <strong>Total: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => batchPayMutation.mutate(Array.from(selectedRecords))}
              disabled={batchPayMutation.isPending}
            >
              {batchPayMutation.isPending ? 'Processando...' : 'Confirmar Pagamentos'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form para nova despesa */}
      <FinancialRecordForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isLoading={createMutation.isPending}
      />
    </>
  );
};
