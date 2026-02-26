import React, { useState, useMemo, useEffect } from 'react';
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
import { ArrowDownCircle, Loader2, DollarSign, CheckCircle, Plus, CheckCircle2, CheckSquare, Filter, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  forma_pagamento: string | null; // PIX, Débito, Crédito
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

// Mapeamento de formas de pagamento
const getPaymentMethodLabel = (method: string | null): string => {
  if (!method) return '-';
  const map: Record<string, string> = {
    'pix': 'PIX',
    'debito': 'Débito',
    'credito': 'Crédito',
    'dinheiro': 'Dinheiro',
    'debit': 'Débito',
    'credit': 'Crédito',
    'cash': 'Dinheiro',
  };
  return map[method.toLowerCase()] || method;
};

// Cores por forma de pagamento
const getPaymentMethodColors = (method: string | null): string => {
  if (!method) return 'bg-gray-100 text-gray-700 border-gray-300';
  const colors: Record<string, string> = {
    'pix': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'debito': 'bg-sky-100 text-sky-700 border-sky-300',
    'debit': 'bg-sky-100 text-sky-700 border-sky-300',
    'credito': 'bg-violet-100 text-violet-700 border-violet-300',
    'credit': 'bg-violet-100 text-violet-700 border-violet-300',
    'dinheiro': 'bg-lime-100 text-lime-700 border-lime-300',
    'cash': 'bg-lime-100 text-lime-700 border-lime-300',
  };
  return colors[method.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
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
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as ContaPagar[];
    },
  });

  // Realtime subscription para contas_pagar
  useEffect(() => {
    const channel = supabase
      .channel('contas-pagar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_pagar'
        },
        (payload) => {
          console.log('🔔 [ERP Realtime] Contas a Pagar atualizada:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['contas-pagar-erp'] });
          
          if (payload.eventType === 'INSERT') {
            toast.success('Nova despesa registrada!');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Despesa atualizada');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
      // Mapear gross_amount para valor (campo usado pelo FinancialRecordForm)
      const valorFinal = values.gross_amount || values.amount || 0;
      
      const { error } = await supabase.from('contas_pagar').insert({
        descricao: values.description,
        valor: valorFinal,
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

  const fmtDateExport = (d: string | null) => {
    if (!d) return '-';
    try { return format(parseISO(d), 'dd/MM/yyyy'); } catch { return d; }
  };

  const exportContasPagarExcel = () => {
    if (!contasPagar || contasPagar.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    const wb = XLSX.utils.book_new();

    const allTotal = contasPagar.reduce((s, c) => s + Number(c.valor), 0);
    const allPagas = contasPagar.filter(c => c.status === 'pago');
    const allPendentes = contasPagar.filter(c => c.status === 'pendente');
    const vencidas = allPendentes.filter(c => new Date(c.data_vencimento) < new Date());

    // Resumo
    const summaryData = [
      ['RELATÓRIO DE CONTAS A PAGAR'],
      ['Gerado em:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      [''],
      ['RESUMO'],
      ['Total Geral:', allTotal],
      ['Total Pago:', allPagas.reduce((s, c) => s + Number(c.valor), 0)],
      ['Total Pendente:', allPendentes.reduce((s, c) => s + Number(c.valor), 0)],
      ['Contas Vencidas:', vencidas.length],
      ['Valor Vencido:', vencidas.reduce((s, c) => s + Number(c.valor), 0)],
      ['Taxa de Pagamento:', allTotal > 0 ? `${((allPagas.reduce((s, c) => s + Number(c.valor), 0) / allTotal) * 100).toFixed(1)}%` : '0%'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    // Detalhado
    const detailData = [
      ['Descrição', 'Fornecedor', 'Categoria', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Status', 'Forma Pgto', 'Observações'],
      ...contasPagar.map(c => [
        c.descricao,
        c.fornecedor || '-',
        getCategoryLabel(c.categoria),
        Number(c.valor),
        fmtDateExport(c.data_vencimento),
        fmtDateExport(c.data_pagamento),
        c.status === 'pago' ? 'Pago' : 'Pendente',
        getPaymentMethodLabel(c.forma_pagamento),
        c.observacoes || '',
      ]),
    ];
    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    wsDetail['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhado');

    // Por fornecedor
    const byForn: Record<string, { total: number; count: number; pago: number; pendente: number }> = {};
    contasPagar.forEach(c => {
      const forn = c.fornecedor || 'Sem fornecedor';
      if (!byForn[forn]) byForn[forn] = { total: 0, count: 0, pago: 0, pendente: 0 };
      byForn[forn].total += Number(c.valor);
      byForn[forn].count++;
      if (c.status === 'pago') byForn[forn].pago += Number(c.valor);
      else byForn[forn].pendente += Number(c.valor);
    });
    const fornData = [
      ['Fornecedor', 'Total (R$)', 'Pago (R$)', 'Pendente (R$)', 'Qtd', '% do Total'],
      ...Object.entries(byForn).sort((a, b) => b[1].total - a[1].total).map(([forn, d]) => [
        forn, d.total, d.pago, d.pendente, d.count,
        allTotal > 0 ? `${((d.total / allTotal) * 100).toFixed(1)}%` : '0%',
      ]),
    ];
    const wsForn = XLSX.utils.aoa_to_sheet(fornData);
    wsForn['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsForn, 'Por Fornecedor');

    // Por categoria
    const byCat: Record<string, { total: number; count: number }> = {};
    contasPagar.forEach(c => {
      const cat = getCategoryLabel(c.categoria);
      if (!byCat[cat]) byCat[cat] = { total: 0, count: 0 };
      byCat[cat].total += Number(c.valor);
      byCat[cat].count++;
    });
    const catData = [
      ['Categoria', 'Total (R$)', 'Qtd', '% do Total'],
      ...Object.entries(byCat).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => [
        cat, d.total, d.count,
        allTotal > 0 ? `${((d.total / allTotal) * 100).toFixed(1)}%` : '0%',
      ]),
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catData);
    wsCat['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoria');

    XLSX.writeFile(wb, `contas_pagar_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Relatório exportado com sucesso!');
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => exportContasPagarExcel()} size="sm">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
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
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {fornecedores.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                type="date" 
                placeholder="Data Início"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
              
              <Input 
                type="date" 
                placeholder="Data Fim"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10 col-span-2 lg:col-span-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700 flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Total a Pagar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-red-700">
                R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700 flex items-center gap-1 sm:gap-2">
                <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pendente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-yellow-700">
                R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 col-span-2 md:col-span-1">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-green-700">
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

        {/* Lista de Contas a Pagar */}
        <Card className="bg-white border-gray-200 overflow-hidden">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Despesas e Comissões
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-3">
            {filteredPayables && filteredPayables.length > 0 ? (
              <>
                {/* Layout Mobile/Tablet: Cards - Texto completo sem cortes */}
                <div className="block xl:hidden space-y-3 px-3">
                  {/* Botão Selecionar Todos (apenas pendentes) */}
                  {pendingFilteredRecords.length > 0 && (
                    <div className="flex items-center gap-2 py-2 border-b border-gray-200 mb-2">
                      <Checkbox
                        checked={pendingFilteredRecords.length > 0 && selectedRecords.size === pendingFilteredRecords.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-600">Selecionar todos pendentes</span>
                    </div>
                  )}
                  
                  {filteredPayables.map((conta) => (
                    <div key={conta.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      {/* Checkbox + Status (linha superior) */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {conta.status === 'pendente' && (
                            <Checkbox
                              checked={selectedRecords.has(conta.id)}
                              onCheckedChange={(checked) => handleSelectRecord(conta.id, !!checked)}
                            />
                          )}
                          <Badge variant="outline" className={`text-xs py-0.5 px-2 ${getCategoryColors(conta.categoria)}`}>
                            {getCategoryLabel(conta.categoria)}
                          </Badge>
                        </div>
                        {getStatusBadge(conta.status)}
                      </div>
                      
                      {/* Descrição - completa, sem cortes */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 block mb-0.5">Descrição</span>
                        <p className="text-sm font-medium text-gray-900">
                          {conta.descricao || '-'}
                        </p>
                      </div>
                      
                      {/* Fornecedor (Barbeiro) - completo, sem cortes */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 block mb-0.5">Fornecedor</span>
                        <p className="text-sm text-gray-800">
                          {conta.fornecedor || 'Não informado'}
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
                      
                      {/* Forma de Pagamento, Valor + Ação */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex flex-col gap-2">
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Pagamento</span>
                            <Badge variant="outline" className={`text-xs py-0.5 px-2 ${getPaymentMethodColors(conta.forma_pagamento)}`}>
                              {getPaymentMethodLabel(conta.forma_pagamento)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="text-xs text-gray-500 block mb-0.5">Valor</span>
                            <span className="text-lg font-bold text-red-600">
                              R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {conta.status === 'pendente' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(conta.id)}
                              className="h-9 px-4 bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
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
                        <TableHead className="w-10 px-3">
                          <Checkbox
                            checked={pendingFilteredRecords.length > 0 && selectedRecords.size === pendingFilteredRecords.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="px-2 text-xs">Data</TableHead>
                        <TableHead className="px-2 text-xs">Hora</TableHead>
                        <TableHead className="px-2 text-xs">Descrição</TableHead>
                        <TableHead className="px-2 text-xs">Fornecedor</TableHead>
                        <TableHead className="px-2 text-xs">Categoria</TableHead>
                        <TableHead className="px-2 text-xs">Pagamento</TableHead>
                        <TableHead className="px-2 text-xs text-right">Valor</TableHead>
                        <TableHead className="px-2 text-xs text-center">Status</TableHead>
                        <TableHead className="px-3 text-xs text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayables.map((conta) => (
                        <TableRow key={conta.id} className="hover:bg-gray-50">
                          <TableCell className="px-3 py-2">
                            {conta.status === 'pendente' && (
                              <Checkbox
                                checked={selectedRecords.has(conta.id)}
                                onCheckedChange={(checked) => handleSelectRecord(conta.id, !!checked)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs whitespace-nowrap">
                            {format(parseISO(conta.data_vencimento), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {formatTransactionTime(conta.created_at)}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs max-w-[220px]">
                            <span className="block truncate" title={conta.descricao || '-'}>
                              {conta.descricao || '-'}
                            </span>
                            {conta.transaction_id && (
                              <span className="block text-[10px] font-mono text-gray-500" title={conta.transaction_id}>
                                ID: {conta.transaction_id}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs max-w-[100px] truncate">
                            {conta.fornecedor || '-'}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getCategoryColors(conta.categoria)}`}>
                              {getCategoryLabel(conta.categoria)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getPaymentMethodColors(conta.forma_pagamento)}`}>
                              {getPaymentMethodLabel(conta.forma_pagamento)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-xs text-right font-semibold text-red-600 whitespace-nowrap">
                            R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            {getStatusBadge(conta.status)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            {conta.status === 'pendente' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(conta.id)}
                                className="h-7 w-7 p-0 bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 px-3">
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
