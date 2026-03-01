import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Filter, Download, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpDown, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryLabel, getStatusLabel, getTransactionTypeLabel, getPaymentMethodLabel } from '@/utils/categoryMappings';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface UnifiedTransaction {
  id: string;
  realId: string; // the actual DB id (without prefix)
  date: string;
  description: string;
  type: 'income' | 'expense' | 'commission';
  typeLabel: string;
  category: string;
  categoryLabel: string;
  amount: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  status: string;
  statusLabel: string;
  barberName: string | null;
  notes: string | null;
  source: 'financial_records' | 'barber_commissions' | 'contas_pagar' | 'contas_receber';
  paymentDate: string | null;
}

const CashFlowTransactions: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Edit dialog state
  const [editItem, setEditItem] = useState<UnifiedTransaction | null>(null);
  const [editForm, setEditForm] = useState({ descricao: '', valor: '', forma_pagamento: '', status: '', observacoes: '', fornecedor: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteItem, setDeleteItem] = useState<UnifiedTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  // Fetch financial_records
  const { data: financialRecords, isLoading: loadingFR } = useQuery({
    queryKey: ['cashflow-financial-records', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .order('transaction_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch barber_commissions
  const { data: commissions, isLoading: loadingComm } = useQuery({
    queryKey: ['cashflow-commissions', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch contas_pagar
  const { data: contasPagar, isLoading: loadingCP } = useQuery({
    queryKey: ['cashflow-contas-pagar', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .gte('data_vencimento', dateFrom)
        .lte('data_vencimento', dateTo)
        .order('data_vencimento', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch contas_receber
  const { data: contasReceber, isLoading: loadingCR } = useQuery({
    queryKey: ['cashflow-contas-receber', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .gte('data_vencimento', dateFrom)
        .lte('data_vencimento', dateTo)
        .order('data_vencimento', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const isLoading = loadingFR || loadingComm || loadingCP || loadingCR;

  // Build a lookup: for commission financial_records, find the matching contas_pagar
  // to get the REAL payment method (how the barber was paid, not the totem payment)
  const commissionPaymentLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    if (!contasPagar || !financialRecords) return lookup;
    
    (financialRecords || []).forEach(fr => {
      if (fr.transaction_type !== 'commission') return;
      // Find matching contas_pagar by description + amount + date
      const matchingCP = (contasPagar || []).find(cp =>
        cp.descricao === fr.description &&
        Number(cp.valor) === Number(fr.amount) &&
        cp.data_vencimento === fr.transaction_date
      );
      if (matchingCP?.forma_pagamento) {
        lookup.set(fr.id, matchingCP.forma_pagamento);
      }
    });
    return lookup;
  }, [financialRecords, contasPagar]);

  // Unify all data sources — financial_records is the SINGLE SOURCE OF TRUTH.
  const unifiedTransactions = useMemo(() => {
    const transactions: UnifiedTransaction[] = [];
    const frReferenceIds = new Set<string>();
    const frFingerprints = new Set<string>();

    // 1) Financial records — always included (canonical source)
    (financialRecords || []).forEach(r => {
      if (r.reference_id) frReferenceIds.add(r.reference_id);
      const fp = `${(r.description || '').toLowerCase().trim()}|${Number(r.amount)}|${r.transaction_date}`;
      frFingerprints.add(fp);

      const isRevenue = r.transaction_type === 'revenue';
      const isCommission = r.transaction_type === 'commission';

      // For commissions, use the payment method from contas_pagar (how the barber was paid)
      const actualPaymentMethod = isCommission
        ? (commissionPaymentLookup.get(r.id) || '')
        : (r.payment_method || '');

      transactions.push({
        id: r.id,
        realId: r.id,
        date: r.transaction_date || r.created_at?.split('T')[0] || '',
        description: r.description || 'Sem descrição',
        type: isCommission ? 'commission' : isRevenue ? 'income' : 'expense',
        typeLabel: getTransactionTypeLabel(r.transaction_type),
        category: r.category || 'other',
        categoryLabel: getCategoryLabel(r.category),
        amount: Number(r.net_amount || r.amount || 0),
        paymentMethod: actualPaymentMethod,
        paymentMethodLabel: getPaymentMethodLabel(actualPaymentMethod),
        status: r.status || 'pending',
        statusLabel: getStatusLabel(r.status || 'pending'),
        barberName: r.barber_name || null,
        notes: r.notes || null,
        source: 'financial_records',
        paymentDate: r.payment_date || null,
      });
    });

    // 2) Barber commissions — only if not already in financial_records
    (commissions || []).forEach(c => {
      if (c.venda_id && frReferenceIds.has(c.venda_id)) return;
      const desc = `Comissão - ${c.barber_name || 'Barbeiro'}${c.tipo ? ` (${c.tipo})` : ''}`;
      const dt = c.data_pagamento || c.created_at?.split('T')[0] || '';
      const fp = `${desc.toLowerCase().trim()}|${Number(c.valor || c.amount || 0)}|${dt}`;
      if (frFingerprints.has(fp)) return;

      transactions.push({
        id: `comm-${c.id}`,
        realId: c.id,
        date: dt,
        description: desc,
        type: 'commission',
        typeLabel: 'Comissão',
        category: 'commissions',
        categoryLabel: 'Comissões',
        amount: Number(c.valor || c.amount || 0),
        paymentMethod: '',
        paymentMethodLabel: '-',
        status: c.status === 'pago' ? 'completed' : 'pending',
        statusLabel: c.status === 'pago' ? 'Pago' : 'Pendente',
        barberName: c.barber_name || null,
        notes: null,
        source: 'barber_commissions',
        paymentDate: c.data_pagamento || c.payment_date || null,
      });
    });

    // 3) Contas a pagar — only if NOT already in financial_records
    (contasPagar || []).forEach(cp => {
      const fp = `${(cp.descricao || '').toLowerCase().trim()}|${Number(cp.valor)}|${cp.data_vencimento}`;
      if (frFingerprints.has(fp)) return;
      const fpAlt = `${(cp.descricao || '').toLowerCase().trim()}|${Number(cp.valor)}|${cp.data_pagamento || cp.data_vencimento}`;
      if (frFingerprints.has(fpAlt)) return;

      transactions.push({
        id: `cp-${cp.id}`,
        realId: cp.id,
        date: cp.data_pagamento || cp.data_vencimento || '',
        description: cp.descricao,
        type: 'expense',
        typeLabel: 'Despesa',
        category: cp.categoria || 'other',
        categoryLabel: getCategoryLabel(cp.categoria),
        amount: Number(cp.valor || 0),
        paymentMethod: cp.forma_pagamento || '',
        paymentMethodLabel: getPaymentMethodLabel(cp.forma_pagamento || ''),
        status: cp.status === 'pago' ? 'completed' : 'pending',
        statusLabel: cp.status === 'pago' ? 'Pago' : 'Pendente',
        barberName: cp.fornecedor || null,
        notes: cp.observacoes || null,
        source: 'contas_pagar',
        paymentDate: cp.data_pagamento || null,
      });
    });

    // 4) Contas a receber — only if NOT already in financial_records
    (contasReceber || []).forEach(cr => {
      const fp = `${(cr.descricao || '').toLowerCase().trim()}|${Number(cr.valor)}|${cr.data_vencimento}`;
      if (frFingerprints.has(fp)) return;
      const fpAlt = `${(cr.descricao || '').toLowerCase().trim()}|${Number(cr.valor)}|${cr.data_recebimento || cr.data_vencimento}`;
      if (frFingerprints.has(fpAlt)) return;

      transactions.push({
        id: `cr-${cr.id}`,
        realId: cr.id,
        date: cr.data_recebimento || cr.data_vencimento || '',
        description: cr.descricao,
        type: 'income',
        typeLabel: 'Receita',
        category: cr.categoria || 'other',
        categoryLabel: getCategoryLabel(cr.categoria),
        amount: Number(cr.valor || 0),
        paymentMethod: cr.forma_pagamento || '',
        paymentMethodLabel: getPaymentMethodLabel(cr.forma_pagamento || ''),
        status: cr.status === 'recebido' ? 'completed' : 'pending',
        statusLabel: cr.status === 'recebido' ? 'Recebido' : 'Pendente',
        barberName: null,
        notes: cr.observacoes || null,
        source: 'contas_receber',
        paymentDate: cr.data_recebimento || null,
      });
    });

    return transactions;
  }, [financialRecords, commissions, contasPagar, contasReceber, commissionPaymentLookup]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...unifiedTransactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(term) ||
        (t.barberName && t.barberName.toLowerCase().includes(term)) ||
        (t.notes && t.notes.toLowerCase().includes(term))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortDir === 'desc' ? -cmp : cmp;
      }
      const cmp = a.amount - b.amount;
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [unifiedTransactions, searchTerm, typeFilter, categoryFilter, statusFilter, sortField, sortDir]);

  // Summary
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCommission = filteredTransactions.filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense, totalCommission, net: totalIncome - totalExpense - totalCommission, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Determine which table a transaction can be edited/deleted from
  const getEditableSource = (t: UnifiedTransaction) => {
    // financial_records commission entries are also editable via their matching contas_pagar
    if (t.source === 'contas_pagar' || t.source === 'contas_receber') return t.source;
    if (t.source === 'financial_records') return 'financial_records';
    if (t.source === 'barber_commissions') return 'barber_commissions';
    return null;
  };

  // Open edit dialog
  const handleEdit = (t: UnifiedTransaction) => {
    setEditItem(t);
    setEditForm({
      descricao: t.description,
      valor: t.amount.toString(),
      forma_pagamento: t.paymentMethod || '',
      status: t.status === 'completed' ? 'pago' : t.status === 'pending' ? 'pendente' : t.status,
      observacoes: t.notes || '',
      fornecedor: t.barberName || '',
    });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      const source = editItem.source;
      
      if (source === 'contas_pagar' || (source === 'financial_records' && editItem.type === 'commission')) {
        // For commissions from financial_records, update the matching contas_pagar
        if (source === 'financial_records' && editItem.type === 'commission') {
          const matchingCP = (contasPagar || []).find(cp =>
            cp.descricao === editItem.description &&
            Number(cp.valor) === editItem.amount
          );
          if (matchingCP) {
            const { error } = await supabase.from('contas_pagar').update({
              descricao: editForm.descricao,
              valor: parseFloat(editForm.valor),
              forma_pagamento: editForm.forma_pagamento || null,
              status: editForm.status,
              observacoes: editForm.observacoes || null,
              fornecedor: editForm.fornecedor || null,
            }).eq('id', matchingCP.id);
            if (error) throw error;
            
            // Also update the financial_records entry
            await supabase.from('financial_records').update({
              description: editForm.descricao,
              amount: parseFloat(editForm.valor),
              net_amount: parseFloat(editForm.valor),
              payment_method: editForm.forma_pagamento || null,
              status: editForm.status === 'pago' ? 'completed' : 'pending',
              notes: editForm.observacoes || null,
              barber_name: editForm.fornecedor || null,
            }).eq('id', editItem.realId);
          }
        } else {
          // Direct contas_pagar update
          const { error } = await supabase.from('contas_pagar').update({
            descricao: editForm.descricao,
            valor: parseFloat(editForm.valor),
            forma_pagamento: editForm.forma_pagamento || null,
            status: editForm.status,
            observacoes: editForm.observacoes || null,
            fornecedor: editForm.fornecedor || null,
          }).eq('id', editItem.realId);
          if (error) throw error;
        }
      } else if (source === 'contas_receber') {
        const { error } = await supabase.from('contas_receber').update({
          descricao: editForm.descricao,
          valor: parseFloat(editForm.valor),
          forma_pagamento: editForm.forma_pagamento || null,
          status: editForm.status === 'pago' ? 'recebido' : editForm.status,
          observacoes: editForm.observacoes || null,
        }).eq('id', editItem.realId);
        if (error) throw error;
      } else if (source === 'financial_records') {
        const { error } = await supabase.from('financial_records').update({
          description: editForm.descricao,
          amount: parseFloat(editForm.valor),
          net_amount: parseFloat(editForm.valor),
          payment_method: editForm.forma_pagamento || null,
          status: editForm.status === 'pago' ? 'completed' : 'pending',
          notes: editForm.observacoes || null,
          barber_name: editForm.fornecedor || null,
        }).eq('id', editItem.realId);
        if (error) throw error;
      } else if (source === 'barber_commissions') {
        const { error } = await supabase.from('barber_commissions').update({
          valor: parseFloat(editForm.valor),
          status: editForm.status,
          barber_name: editForm.fornecedor || null,
        }).eq('id', editItem.realId);
        if (error) throw error;
      }

      toast.success('Registro atualizado com sucesso');
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ['cashflow-financial-records'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-contas-receber'] });
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete transaction
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const source = deleteItem.source;
      
      if (source === 'financial_records') {
        // If it's a commission, also delete the matching contas_pagar and barber_commissions
        if (deleteItem.type === 'commission') {
          const matchingCP = (contasPagar || []).find(cp =>
            cp.descricao === deleteItem.description &&
            Number(cp.valor) === deleteItem.amount
          );
          if (matchingCP) {
            await supabase.from('contas_pagar').delete().eq('id', matchingCP.id);
          }
          // Delete matching barber_commission
          const matchingBC = (commissions || []).find(c =>
            Number(c.valor || c.amount || 0) === deleteItem.amount &&
            c.barber_name === deleteItem.barberName
          );
          if (matchingBC) {
            await supabase.from('barber_commissions').delete().eq('id', matchingBC.id);
          }
        }
        const { error } = await supabase.from('financial_records').delete().eq('id', deleteItem.realId);
        if (error) throw error;
      } else if (source === 'contas_pagar') {
        const { error } = await supabase.from('contas_pagar').delete().eq('id', deleteItem.realId);
        if (error) throw error;
      } else if (source === 'contas_receber') {
        const { error } = await supabase.from('contas_receber').delete().eq('id', deleteItem.realId);
        if (error) throw error;
      } else if (source === 'barber_commissions') {
        const { error } = await supabase.from('barber_commissions').delete().eq('id', deleteItem.realId);
        if (error) throw error;
      }

      toast.success('Registro excluído com sucesso');
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ['cashflow-financial-records'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-contas-receber'] });
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const rows = filteredTransactions.map(t => ({
      'Data': t.date ? format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      'Data Pgto': t.paymentDate ? format(parseISO(t.paymentDate), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      'Tipo': t.typeLabel,
      'Descrição': t.description,
      'Categoria': t.categoryLabel,
      'Barbeiro/Fornecedor': t.barberName || '-',
      'Valor (R$)': t.amount,
      'Forma Pagamento': t.paymentMethodLabel,
      'Status': t.statusLabel,
      'Observações': t.notes || '-',
    }));

    const summaryRows = [
      { 'Indicador': 'Total Receitas', 'Valor (R$)': summary.totalIncome },
      { 'Indicador': 'Total Despesas', 'Valor (R$)': summary.totalExpense },
      { 'Indicador': 'Total Comissões', 'Valor (R$)': summary.totalCommission },
      { 'Indicador': 'Saldo Líquido', 'Valor (R$)': summary.net },
      { 'Indicador': 'Total de Transações', 'Valor (R$)': summary.count },
      { 'Indicador': 'Período', 'Valor (R$)': `${format(parseISO(dateFrom), 'dd/MM/yyyy')} a ${format(parseISO(dateTo), 'dd/MM/yyyy')}` },
    ];

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    const wsTransactions = XLSX.utils.json_to_sheet(rows);
    wsTransactions['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 18 },
      { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transações');

    const commissionRows = filteredTransactions
      .filter(t => t.type === 'commission')
      .map(t => ({
        'Data': t.date ? format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Data Pgto': t.paymentDate ? format(parseISO(t.paymentDate), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Barbeiro': t.barberName || '-',
        'Descrição': t.description,
        'Valor (R$)': t.amount,
        'Forma Pagamento': t.paymentMethodLabel,
        'Status': t.statusLabel,
      }));
    if (commissionRows.length > 0) {
      const wsComm = XLSX.utils.json_to_sheet(commissionRows);
      wsComm['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 35 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsComm, 'Comissões');
    }

    const expenseRows = filteredTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        'Data': t.date ? format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Data Pgto': t.paymentDate ? format(parseISO(t.paymentDate), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Descrição': t.description,
        'Categoria': t.categoryLabel,
        'Fornecedor': t.barberName || '-',
        'Valor (R$)': t.amount,
        'Forma Pagamento': t.paymentMethodLabel,
        'Status': t.statusLabel,
      }));
    if (expenseRows.length > 0) {
      const wsExp = XLSX.utils.json_to_sheet(expenseRows);
      wsExp['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsExp, 'Despesas');
    }

    const incomeRows = filteredTransactions
      .filter(t => t.type === 'income')
      .map(t => ({
        'Data': t.date ? format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Data Pgto': t.paymentDate ? format(parseISO(t.paymentDate), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        'Descrição': t.description,
        'Categoria': t.categoryLabel,
        'Valor (R$)': t.amount,
        'Forma Pagamento': t.paymentMethodLabel,
        'Status': t.statusLabel,
      }));
    if (incomeRows.length > 0) {
      const wsInc = XLSX.utils.json_to_sheet(incomeRows);
      wsInc['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsInc, 'Receitas');
    }

    const period = `${format(parseISO(dateFrom), 'dd-MM-yyyy')}_${format(parseISO(dateTo), 'dd-MM-yyyy')}`;
    XLSX.writeFile(wb, `Relatorio_Transacoes_${period}.xlsx`);
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando transações...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-[10px] sm:text-xs text-green-600 font-medium">Receitas</p>
          <p className="text-sm sm:text-lg font-bold text-green-700">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-[10px] sm:text-xs text-red-600 font-medium">Despesas</p>
          <p className="text-sm sm:text-lg font-bold text-red-700">{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-[10px] sm:text-xs text-orange-600 font-medium">Comissões</p>
          <p className="text-sm sm:text-lg font-bold text-orange-700">{formatCurrency(summary.totalCommission)}</p>
        </div>
        <div className={`border rounded-lg p-3 text-center ${summary.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-300'}`}>
          <p className="text-[10px] sm:text-xs font-medium" style={{ color: summary.net >= 0 ? '#2563eb' : '#dc2626' }}>Saldo</p>
          <p className="text-sm sm:text-lg font-bold" style={{ color: summary.net >= 0 ? '#1d4ed8' : '#b91c1c' }}>{formatCurrency(summary.net)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center col-span-2 lg:col-span-1">
          <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Transações</p>
          <p className="text-sm sm:text-lg font-bold text-gray-800">{summary.count}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white border-gray-300 text-sm h-9"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-0.5 block">De</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white border-gray-300 text-sm h-9"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-0.5 block">Até</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white border-gray-300 text-sm h-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white border-gray-300 text-sm h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="commission">Comissões</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-white border-gray-300 text-sm h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="services">Serviços</SelectItem>
              <SelectItem value="products">Produtos</SelectItem>
              <SelectItem value="commissions">Comissões</SelectItem>
              <SelectItem value="staff_payments">Pgto Funcionários</SelectItem>
              <SelectItem value="supplies">Insumos</SelectItem>
              <SelectItem value="rent">Aluguel</SelectItem>
              <SelectItem value="utilities">Utilidades</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="tips">Gorjetas</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-gray-300 text-sm h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="completed">Pago/Concluído</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1.5">
            <Button
              variant="outline"
              className="bg-white border-gray-300 hover:bg-gray-50 text-sm h-9 flex-1"
              onClick={clearFilters}
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white text-sm h-9 flex-1"
              onClick={exportToExcel}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="border-b border-gray-300">
              <th
                className="text-left py-2.5 px-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Data
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Dt. Pgto</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Tipo</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 min-w-[200px]">Descrição</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Categoria</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Barbeiro/Forn.</th>
              <th
                className="text-right py-2.5 px-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  Valor
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Pagamento</th>
              <th className="text-center py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Status</th>
              <th className="text-center py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, idx) => {
                const isIncome = t.type === 'income';
                const isCommission = t.type === 'commission';
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                return (
                  <tr
                    key={t.id}
                    className={`${rowBg} border-b border-gray-100 hover:bg-gray-100/80 transition-colors`}
                    title={t.notes || ''}
                  >
                    <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
                      {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {t.paymentDate ? format(parseISO(t.paymentDate), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isIncome
                          ? 'bg-green-100 text-green-700'
                          : isCommission
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.typeLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-800 font-medium">
                      <div className="truncate max-w-[300px]" title={t.description}>
                        {t.description}
                      </div>
                      {t.notes && (
                        <div className="text-[10px] text-gray-500 truncate max-w-[300px]">{t.notes}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                        {t.categoryLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {t.barberName || '-'}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                      isIncome ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap text-xs">
                      {t.paymentMethodLabel || '-'}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.status === 'completed' || t.status === 'recebido'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.statusLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(t)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteItem(t)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <DollarSign className="h-10 w-10 mb-3" />
                    <p className="font-semibold text-gray-600">Nenhuma transação encontrada</p>
                    <p className="text-sm text-gray-500 mt-1">Ajuste os filtros ou período para ver as transações</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Descrição</label>
              <Input
                value={editForm.descricao}
                onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.valor}
                  onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Forma de Pagamento</label>
                <Select value={editForm.forma_pagamento} onValueChange={v => setEditForm(f => ({ ...f, forma_pagamento: v }))}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Fornecedor/Barbeiro</label>
                <Input
                  value={editForm.fornecedor}
                  onChange={e => setEditForm(f => ({ ...f, fornecedor: e.target.value }))}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Observações</label>
              <Input
                value={editForm.observacoes}
                onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditItem(null)} className="border-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação?
              <br />
              <strong>{deleteItem?.description}</strong> - {deleteItem ? formatCurrency(deleteItem.amount) : ''}
              <br />
              <span className="text-red-600 text-xs mt-1 block">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashFlowTransactions;