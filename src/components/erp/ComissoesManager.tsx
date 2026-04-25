import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users, DollarSign, Clock, CheckCircle, Download, FileText, Search,
  TrendingUp, AlertCircle, Loader2, Receipt, Printer, Scissors, Package, Coins
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { getNowInBrazil } from '@/lib/utils/dateUtils';

// ─── Interfaces ───────────────────────────────────────────
interface Commission {
  id: string;
  barber_id: string;
  barber_name: string | null;
  valor: number;
  amount: number | null;
  tipo: string | null;
  status: string | null;
  venda_id: string | null;
  appointment_id: string | null;
  appointment_source: string | null;
  commission_rate: number | null;
  created_at: string | null;
  data_pagamento: string | null;
  payment_date: string | null;
}

interface Barber {
  id: string;
  nome: string;
  foto_url: string | null;
  taxa_comissao: number | null;
  ativo: boolean | null;
}

interface BarberSummary {
  barber: Barber;
  // Serviços
  servicoPago: number;
  servicoPendente: number;
  // Produtos
  produtoPago: number;
  produtoPendente: number;
  // Gorjetas
  gorjetaPaga: number;
  gorjetaPendente: number;
  // Plano
  planoPago: number;
  planoPendente: number;
  // Vales (adiantamentos a descontar do total a pagar)
  valePago: number;
  valePendente: number;
  valeTotal: number;
  // Totais
  totalPago: number;
  totalPendente: number;
  totalGeral: number;
  // Total Líquido a Pagar (totalGeral - vales)
  totalLiquidoPagar: number;
  qtdComissoes: number;
  qtdVales: number;
}

// ─── Theme Colors (FIXED per tab) ─────────────────────────
const TAB_THEMES = {
  resumo: {
    activeBg: 'data-[state=active]:bg-purple-600',
    activeText: 'data-[state=active]:text-white',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    headerBg: 'bg-purple-100',
  },
  detalhes: {
    activeBg: 'data-[state=active]:bg-blue-600',
    activeText: 'data-[state=active]:text-white',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    headerBg: 'bg-blue-100',
  },
  contas: {
    activeBg: 'data-[state=active]:bg-amber-600',
    activeText: 'data-[state=active]:text-white',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    headerBg: 'bg-amber-100',
  },
};

// ─── Helpers ──────────────────────────────────────────────
const formatCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'pago':
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
    case 'pendente':
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{status || '-'}</Badge>;
  }
};

const getTipoBadge = (tipo: string | null) => {
  switch (tipo) {
    case 'servico':
      return <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">Serviço</Badge>;
    case 'produto':
      return <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">Produto</Badge>;
    case 'gorjeta':
      return <Badge variant="outline" className="text-pink-700 border-pink-300 bg-pink-50">Gorjeta</Badge>;
    case 'plano':
      return <Badge variant="outline" className="text-indigo-700 border-indigo-300 bg-indigo-50">Plano</Badge>;
    default:
      return <Badge variant="outline">{tipo || '-'}</Badge>;
  }
};

const normalizeStatus = (s: string | null): string => {
  if (!s) return 'pendente';
  if (s === 'paid') return 'pago';
  if (s === 'pending') return 'pendente';
  return s;
};

// ─── Main Component ───────────────────────────────────────
const ComissoesManager: React.FC = () => {
  const now = getNowInBrazil();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedBarber, setSelectedBarber] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'resumo' | 'detalhes' | 'contas'>('resumo');
  const [receiptCommission, setReceiptCommission] = useState<Commission | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  // ─── Queries ──────────────────────────────────────────
  const { data: barbers = [] } = useQuery({
    queryKey: ['comissoes-barbers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, foto_url, taxa_comissao, ativo')
        .order('nome');
      return (data || []) as Barber[];
    },
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['comissoes-manager', selectedYear, selectedMonth],
    queryFn: async () => {
      const y = parseInt(selectedYear);
      const m = parseInt(selectedMonth);
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDayNum = new Date(y, m, 0).getDate();
      const lastDay = `${y}-${String(m).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

      const { data } = await supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', `${firstDay}T00:00:00`)
        .lte('created_at', `${lastDay}T23:59:59`)
        .order('created_at', { ascending: false });

      return (data || []) as Commission[];
    },
  });

  const { data: contasPagarComissoes = [] } = useQuery({
    queryKey: ['contas-pagar-comissoes', selectedYear, selectedMonth],
    queryFn: async () => {
      const y = parseInt(selectedYear);
      const m = parseInt(selectedMonth);
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDayNum = new Date(y, m, 0).getDate();
      const lastDay = `${y}-${String(m).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

      const { data } = await supabase
        .from('contas_pagar')
        .select('*')
        .or('categoria.eq.Comissão,categoria.eq.comissao,categoria.ilike.%comiss%,categoria.ilike.%gorjeta%,categoria.eq.vale,categoria.ilike.%vale%,categoria.eq.staff_payments')
        .gte('data_vencimento', firstDay)
        .lte('data_vencimento', lastDay)
        .order('data_vencimento', { ascending: false });

      return data || [];
    },
  });

  // ─── Filtered Data ────────────────────────────────────
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      if (selectedBarber !== 'todos' && c.barber_id !== selectedBarber) return false;
      if (selectedStatus !== 'todos' && normalizeStatus(c.status) !== selectedStatus) return false;
      if (selectedTipo !== 'todos' && c.tipo !== selectedTipo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (c.barber_name || '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [commissions, selectedBarber, selectedStatus, selectedTipo, searchQuery]);

  // ─── Barber Summaries (Detailed by Type & Status) ─────
  const barberSummaries = useMemo((): BarberSummary[] => {
    const map = new Map<string, BarberSummary>();

    const initSummary = (barber: Barber): BarberSummary => ({
      barber,
      servicoPago: 0, servicoPendente: 0,
      produtoPago: 0, produtoPendente: 0,
      gorjetaPaga: 0, gorjetaPendente: 0,
      planoPago: 0, planoPendente: 0,
      valePago: 0, valePendente: 0, valeTotal: 0,
      totalPago: 0, totalPendente: 0, totalGeral: 0,
      totalLiquidoPagar: 0,
      qtdComissoes: 0,
      qtdVales: 0,
    });

    for (const barber of barbers) {
      map.set(barber.id, initSummary(barber));
    }

    for (const c of commissions) {
      let summary = map.get(c.barber_id);
      if (!summary) {
        const barber: Barber = {
          id: c.barber_id,
          nome: c.barber_name || 'Desconhecido',
          foto_url: null,
          taxa_comissao: c.commission_rate,
          ativo: true,
        };
        summary = initSummary(barber);
        map.set(c.barber_id, summary);
      }

      const valor = Number(c.valor || 0);
      const status = normalizeStatus(c.status);
      const tipo = c.tipo || 'servico';
      const isPago = status === 'pago';

      if (tipo === 'gorjeta') {
        if (isPago) summary.gorjetaPaga += valor;
        else summary.gorjetaPendente += valor;
      } else if (tipo === 'produto') {
        if (isPago) summary.produtoPago += valor;
        else summary.produtoPendente += valor;
      } else if (tipo === 'plano') {
        if (isPago) summary.planoPago += valor;
        else summary.planoPendente += valor;
      } else {
        if (isPago) summary.servicoPago += valor;
        else summary.servicoPendente += valor;
      }

      if (isPago) summary.totalPago += valor;
      else summary.totalPendente += valor;
      summary.totalGeral += valor;
      summary.qtdComissoes++;
    }

    // Agregar vales (categoria = 'vale') por barbeiro (fornecedor)
    const isValeCategory = (cat: string | null) => {
      if (!cat) return false;
      const c = cat.toLowerCase();
      return c === 'vale' || c.includes('vale');
    };

    for (const cp of contasPagarComissoes as any[]) {
      if (!isValeCategory(cp.categoria)) continue;
      const fornecedor = (cp.fornecedor || '').trim();
      if (!fornecedor) continue;

      // Localizar barbeiro pelo nome (case-insensitive, trim)
      let summary: BarberSummary | undefined;
      for (const s of map.values()) {
        if (s.barber.nome.trim().toLowerCase() === fornecedor.toLowerCase()) {
          summary = s;
          break;
        }
      }

      // Se não existir barbeiro registrado, criar entrada virtual
      if (!summary) {
        const virtual: Barber = {
          id: `vale-${fornecedor}`,
          nome: fornecedor,
          foto_url: null,
          taxa_comissao: null,
          ativo: true,
        };
        summary = initSummary(virtual);
        map.set(virtual.id, summary);
      }

      const valor = Number(cp.valor || 0);
      const isPago = (cp.status || '').toLowerCase() === 'pago';
      if (isPago) summary.valePago += valor;
      else summary.valePendente += valor;
      summary.valeTotal += valor;
      summary.qtdVales++;
    }

    // Calcular Total Líquido a Pagar (Total Geral - Vales)
    for (const s of map.values()) {
      s.totalLiquidoPagar = s.totalGeral - s.valeTotal;
    }

    return Array.from(map.values())
      .filter(s => s.qtdComissoes > 0 || s.qtdVales > 0 || s.barber.ativo)
      .sort((a, b) => b.totalGeral - a.totalGeral);
  }, [barbers, commissions, contasPagarComissoes]);

  // ─── KPIs ─────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalPago = commissions
      .filter(c => normalizeStatus(c.status) === 'pago')
      .reduce((s, c) => s + Number(c.valor || 0), 0);
    const totalPendente = commissions
      .filter(c => normalizeStatus(c.status) === 'pendente')
      .reduce((s, c) => s + Number(c.valor || 0), 0);
    const totalGorjetas = commissions
      .filter(c => c.tipo === 'gorjeta')
      .reduce((s, c) => s + Number(c.valor || 0), 0);
    const totalProdutos = commissions
      .filter(c => c.tipo === 'produto')
      .reduce((s, c) => s + Number(c.valor || 0), 0);
    const totalServicos = commissions
      .filter(c => !c.tipo || c.tipo === 'servico')
      .reduce((s, c) => s + Number(c.valor || 0), 0);
    const total = commissions.reduce((s, c) => s + Number(c.valor || 0), 0);
    const barbeirosAtivos = new Set(commissions.map(c => c.barber_id)).size;
    const totalVales = (contasPagarComissoes as any[])
      .filter(cp => {
        const c = (cp.categoria || '').toLowerCase();
        return c === 'vale' || c.includes('vale');
      })
      .reduce((s, cp) => s + Number(cp.valor || 0), 0);
    const liquidoPagar = total - totalVales;

    return { totalPago, totalPendente, totalGorjetas, totalProdutos, totalServicos, total, barbeirosAtivos, qtd: commissions.length, totalVales, liquidoPagar };
  }, [commissions, contasPagarComissoes]);

  // ─── Export Excel ─────────────────────────────────────
  const handleExportExcel = useCallback(() => {
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

    // Sheet: Resumo Detalhado por Barbeiro (Planilha estilo Excel)
    const resumoData = barberSummaries.map(s => ({
      'Barbeiro': s.barber.nome,
      'Taxa (%)': s.barber.taxa_comissao || 0,
      'Serviços Pagos (R$)': s.servicoPago,
      'Serviços Pendentes (R$)': s.servicoPendente,
      'Produtos Pagos (R$)': s.produtoPago,
      'Produtos Pendentes (R$)': s.produtoPendente,
      'Gorjetas Pagas (R$)': s.gorjetaPaga,
      'Gorjetas Pendentes (R$)': s.gorjetaPendente,
      'Plano Pago (R$)': s.planoPago,
      'Plano Pendente (R$)': s.planoPendente,
      'TOTAL PAGO (R$)': s.totalPago,
      'TOTAL PENDENTE (R$)': s.totalPendente,
      'TOTAL GERAL (R$)': s.totalGeral,
      'Qtd Comissões': s.qtdComissoes,
    }));

    const detalheData = filteredCommissions.map(c => ({
      'Data': c.created_at ? format(parseISO(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Barbeiro': c.barber_name || '-',
      'Tipo': c.tipo || '-',
      'Valor (R$)': Number(c.valor || 0),
      'Status': normalizeStatus(c.status) === 'pago' ? 'Pago' : 'Pendente',
      'Data Pagamento': c.data_pagamento ? format(parseISO(c.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      'Origem': c.appointment_source || '-',
      'ID Venda': c.venda_id ? c.venda_id.substring(0, 8) : '-',
    }));

    const contasPagarData = contasPagarComissoes.map((cp: any) => ({
      'Descrição': cp.descricao,
      'Fornecedor (Barbeiro)': cp.fornecedor || '-',
      'Categoria': cp.categoria || '-',
      'Valor (R$)': Number(cp.valor || 0),
      'Vencimento': cp.data_vencimento ? format(parseISO(cp.data_vencimento), 'dd/MM/yyyy') : '-',
      'Pagamento': cp.data_pagamento ? format(parseISO(cp.data_pagamento), 'dd/MM/yyyy') : '-',
      'Status': cp.status || '-',
      'Forma Pagamento': cp.forma_pagamento || '-',
    }));

    const wb = XLSX.utils.book_new();

    const kpiSheet = XLSX.utils.aoa_to_sheet([
      ['RELATÓRIO DE COMISSÕES — BARBEARIA COSTA URBANA'],
      [`Período: ${monthLabel} / ${selectedYear}`],
      [`Gerado em: ${format(getNowInBrazil(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [],
      ['INDICADORES GERAIS'],
      ['Total Geral', kpis.total],
      ['Total Pago', kpis.totalPago],
      ['Total Pendente', kpis.totalPendente],
      [],
      ['POR TIPO'],
      ['Serviços', kpis.totalServicos],
      ['Produtos', kpis.totalProdutos],
      ['Gorjetas', kpis.totalGorjetas],
      [],
      ['Barbeiros Ativos', kpis.barbeirosAtivos],
      ['Qtd. Comissões', kpis.qtd],
    ]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'Resumo Executivo');

    if (resumoData.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Por Barbeiro');
    }

    if (detalheData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(detalheData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Detalhamento');
    }

    if (contasPagarData.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(contasPagarData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Contas a Pagar');
    }

    XLSX.writeFile(wb, `comissoes_${selectedMonth}_${selectedYear}.xlsx`);
    toast.success('Relatório exportado com sucesso!');
  }, [barberSummaries, filteredCommissions, contasPagarComissoes, kpis, selectedMonth, selectedYear, months]);

  const handlePrintReceipt = useCallback(() => {
    if (!receiptCommission) return;
    const c = receiptCommission;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;

    w.document.write(`
      <html><head><title>Recibo de Comissão</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h1 { font-size: 18px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .field { margin: 10px 0; display: flex; justify-content: space-between; }
        .label { font-weight: bold; color: #555; }
        .value { text-align: right; }
        .total { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }
        .sig { margin-top: 60px; border-top: 1px solid #333; width: 200px; margin-left: auto; margin-right: auto; text-align: center; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>RECIBO DE COMISSÃO</h1>
        <div class="field"><span class="label">Barbeiro:</span><span class="value">${c.barber_name || '-'}</span></div>
        <div class="field"><span class="label">Tipo:</span><span class="value">${c.tipo || '-'}</span></div>
        <div class="field"><span class="label">Data Lançamento:</span><span class="value">${c.created_at ? format(parseISO(c.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</span></div>
        <div class="field"><span class="label">Data Pagamento:</span><span class="value">${c.data_pagamento ? format(parseISO(c.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</span></div>
        <div class="field"><span class="label">Status:</span><span class="value">${normalizeStatus(c.status) === 'pago' ? 'PAGO' : 'PENDENTE'}</span></div>
        <div class="field"><span class="label">Origem:</span><span class="value">${c.appointment_source || '-'}</span></div>
        <div class="total">${formatCurrency(Number(c.valor || 0))}</div>
        <div class="sig">${c.barber_name || 'Barbeiro'}</div>
        <div class="footer">Gerado em ${format(getNowInBrazil(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}<br/>Barbearia Costa Urbana</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  }, [receiptCommission]);

  // Totals row helper for spreadsheet
  const summaryTotals = useMemo(() => {
    return barberSummaries.reduce((acc, s) => ({
      servicoPago: acc.servicoPago + s.servicoPago,
      servicoPendente: acc.servicoPendente + s.servicoPendente,
      produtoPago: acc.produtoPago + s.produtoPago,
      produtoPendente: acc.produtoPendente + s.produtoPendente,
      gorjetaPaga: acc.gorjetaPaga + s.gorjetaPaga,
      gorjetaPendente: acc.gorjetaPendente + s.gorjetaPendente,
      valePago: acc.valePago + s.valePago,
      valePendente: acc.valePendente + s.valePendente,
      valeTotal: acc.valeTotal + s.valeTotal,
      totalPago: acc.totalPago + s.totalPago,
      totalPendente: acc.totalPendente + s.totalPendente,
      totalGeral: acc.totalGeral + s.totalGeral,
      totalLiquidoPagar: acc.totalLiquidoPagar + s.totalLiquidoPagar,
    }), {
      servicoPago: 0, servicoPendente: 0, produtoPago: 0, produtoPendente: 0,
      gorjetaPaga: 0, gorjetaPendente: 0,
      valePago: 0, valePendente: 0, valeTotal: 0,
      totalPago: 0, totalPendente: 0, totalGeral: 0, totalLiquidoPagar: 0,
    });
  }, [barberSummaries]);

  const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-purple-600" />
            Gestão de Comissões
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {monthLabel} / {selectedYear} • {kpis.qtd} comissões • {kpis.barbeirosAtivos} barbeiros
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="text-green-700 border-green-300 hover:bg-green-50">
            <Download className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-white border-gray-300 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-white border-gray-300 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="bg-white border-gray-300 text-sm"><SelectValue placeholder="Barbeiro" /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="todos">Todos os Barbeiros</SelectItem>
                {barbers.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white border-gray-300 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="bg-white border-gray-300 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="servico">Serviço</SelectItem>
                <SelectItem value="produto">Produto</SelectItem>
                <SelectItem value="gorjeta">Gorjeta</SelectItem>
                <SelectItem value="plano">Plano</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar barbeiro..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-300 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: 'Total Geral', value: formatCurrency(kpis.total), icon: DollarSign, color: 'text-blue-700', bg: 'bg-blue-50' },
          { title: 'Total Pago', value: formatCurrency(kpis.totalPago), icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
          { title: 'Total Pendente', value: formatCurrency(kpis.totalPendente), icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { title: 'Serviços', value: formatCurrency(kpis.totalServicos), icon: Scissors, color: 'text-blue-700', bg: 'bg-blue-50' },
          { title: 'Produtos', value: formatCurrency(kpis.totalProdutos), icon: Package, color: 'text-purple-700', bg: 'bg-purple-50' },
          { title: 'Gorjetas', value: formatCurrency(kpis.totalGorjetas), icon: Coins, color: 'text-pink-700', bg: 'bg-pink-50' },
        ].map((card, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-auto gap-1 p-1">
          <TabsTrigger
            value="resumo"
            className="bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-700 data-[state=active]:shadow-md text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3 transition-colors"
          >
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Resumo por Barbeiro</span>
            <span className="sm:hidden">Resumo</span>
          </TabsTrigger>
          <TabsTrigger
            value="detalhes"
            className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-700 data-[state=active]:shadow-md text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3 transition-colors"
          >
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Detalhamento</span>
            <span className="sm:hidden">Detalhe</span>
          </TabsTrigger>
          <TabsTrigger
            value="contas"
            className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:border-amber-700 data-[state=active]:shadow-md text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3 transition-colors"
          >
            <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Contas a Pagar</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Resumo por Barbeiro — PLANILHA DIDÁTICA (ROXO) */}
        <TabsContent value="resumo" key="resumo-tab" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-purple-400" /></div>
          ) : barberSummaries.length === 0 ? (
            <Card className={`bg-white ${TAB_THEMES.resumo.border}`}><CardContent className="p-8 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />Nenhuma comissão encontrada neste período.
            </CardContent></Card>
          ) : (
            <Card className={`bg-white ${TAB_THEMES.resumo.border} border-2 overflow-hidden`}>
              <CardHeader className={`${TAB_THEMES.resumo.bg} border-b ${TAB_THEMES.resumo.border} py-3`}>
                <CardTitle className={`text-sm font-bold ${TAB_THEMES.resumo.text} flex items-center gap-2`}>
                  <Users className="h-4 w-4" />
                  Planilha de Comissões por Barbeiro — {monthLabel}/{selectedYear}
                </CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">
                  Visualize todas as comissões (Serviços, Produtos, Gorjetas) separadas por status (Pago / Pendente).
                </p>
              </CardHeader>

              {/* Desktop: Spreadsheet style */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={TAB_THEMES.resumo.headerBg}>
                      <TableHead className="text-xs font-bold text-purple-900 sticky left-0 bg-purple-100 z-10 min-w-[180px]">
                        Barbeiro
                      </TableHead>
                      <TableHead colSpan={2} className="text-xs font-bold text-blue-900 text-center border-l border-purple-300 bg-blue-50">
                        <div className="flex items-center justify-center gap-1">
                          <Scissors className="h-3 w-3" /> Serviços
                        </div>
                      </TableHead>
                      <TableHead colSpan={2} className="text-xs font-bold text-purple-900 text-center border-l border-purple-300 bg-purple-50">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="h-3 w-3" /> Produtos
                        </div>
                      </TableHead>
                      <TableHead colSpan={2} className="text-xs font-bold text-pink-900 text-center border-l border-purple-300 bg-pink-50">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="h-3 w-3" /> Gorjetas
                        </div>
                      </TableHead>
                      <TableHead colSpan={2} className="text-xs font-bold text-orange-900 text-center border-l border-purple-300 bg-orange-50">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3" /> Vales
                        </div>
                      </TableHead>
                      <TableHead colSpan={4} className="text-xs font-bold text-gray-900 text-center border-l border-purple-300 bg-gray-100">
                        Totais
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-purple-50">
                      <TableHead className="text-[10px] font-medium text-purple-700 sticky left-0 bg-purple-50 z-10">
                        Profissional
                      </TableHead>
                      <TableHead className="text-[10px] font-medium text-green-700 text-right border-l border-purple-200">✓ Pago</TableHead>
                      <TableHead className="text-[10px] font-medium text-yellow-700 text-right">⏳ Pendente</TableHead>
                      <TableHead className="text-[10px] font-medium text-green-700 text-right border-l border-purple-200">✓ Pago</TableHead>
                      <TableHead className="text-[10px] font-medium text-yellow-700 text-right">⏳ Pendente</TableHead>
                      <TableHead className="text-[10px] font-medium text-green-700 text-right border-l border-purple-200">✓ Paga</TableHead>
                      <TableHead className="text-[10px] font-medium text-yellow-700 text-right">⏳ Pendente</TableHead>
                      <TableHead className="text-[10px] font-medium text-orange-700 text-right border-l border-purple-200">✓ Pago</TableHead>
                      <TableHead className="text-[10px] font-medium text-orange-700 text-right">⏳ Pendente</TableHead>
                      <TableHead className="text-[10px] font-medium text-green-700 text-right border-l border-purple-200">Total Pago</TableHead>
                      <TableHead className="text-[10px] font-medium text-yellow-700 text-right">Total Pendente</TableHead>
                      <TableHead className="text-[10px] font-bold text-gray-900 text-right">Total Bruto</TableHead>
                      <TableHead className="text-[10px] font-bold text-purple-900 text-right border-l border-purple-200">A Pagar (Líquido)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barberSummaries.map((s, idx) => (
                      <TableRow key={s.barber.id} className={idx % 2 === 0 ? 'bg-white hover:bg-purple-50/50' : 'bg-gray-50/50 hover:bg-purple-50/50'}>
                        <TableCell className={`sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={s.barber.foto_url || ''} />
                              <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-[10px]">
                                {s.barber.nome.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">{s.barber.nome}</p>
                              <p className="text-[10px] text-gray-500">
                                {s.barber.taxa_comissao || 0}% • {s.qtdComissoes} com.
                                {s.qtdVales > 0 && <span className="text-orange-600 font-medium"> • {s.qtdVales} vale{s.qtdVales > 1 ? 's' : ''}</span>}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-green-700 border-l border-purple-100">{formatCurrency(s.servicoPago)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-yellow-700">{formatCurrency(s.servicoPendente)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-green-700 border-l border-purple-100">{formatCurrency(s.produtoPago)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-yellow-700">{formatCurrency(s.produtoPendente)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-green-700 border-l border-purple-100">{formatCurrency(s.gorjetaPaga)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-yellow-700">{formatCurrency(s.gorjetaPendente)}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-orange-700 border-l border-purple-100 bg-orange-50/40">
                          {s.valePago > 0 ? `- ${formatCurrency(s.valePago)}` : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-orange-700 bg-orange-50/40">
                          {s.valePendente > 0 ? `- ${formatCurrency(s.valePendente)}` : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-green-800 border-l border-purple-100 bg-green-50/40">{formatCurrency(s.totalPago)}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-yellow-800 bg-yellow-50/40">{formatCurrency(s.totalPendente)}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-purple-900 bg-purple-50/40">{formatCurrency(s.totalGeral)}</TableCell>
                        <TableCell className={`text-right text-xs font-extrabold border-l border-purple-200 ${s.totalLiquidoPagar < 0 ? 'text-red-700 bg-red-50' : 'text-purple-900 bg-purple-100'}`}>
                          {formatCurrency(s.totalLiquidoPagar)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow className="bg-purple-100 font-bold border-t-2 border-purple-400">
                      <TableCell className="sticky left-0 bg-purple-100 z-10 text-xs font-bold text-purple-900">
                        TOTAL GERAL
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-green-800 border-l border-purple-300">{formatCurrency(summaryTotals.servicoPago)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-yellow-800">{formatCurrency(summaryTotals.servicoPendente)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-green-800 border-l border-purple-300">{formatCurrency(summaryTotals.produtoPago)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-yellow-800">{formatCurrency(summaryTotals.produtoPendente)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-green-800 border-l border-purple-300">{formatCurrency(summaryTotals.gorjetaPaga)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-yellow-800">{formatCurrency(summaryTotals.gorjetaPendente)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-orange-800 border-l border-purple-300 bg-orange-100">
                        {summaryTotals.valePago > 0 ? `- ${formatCurrency(summaryTotals.valePago)}` : formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-orange-800 bg-orange-100">
                        {summaryTotals.valePendente > 0 ? `- ${formatCurrency(summaryTotals.valePendente)}` : formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-green-900 border-l border-purple-300 bg-green-100">{formatCurrency(summaryTotals.totalPago)}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-yellow-900 bg-yellow-100">{formatCurrency(summaryTotals.totalPendente)}</TableCell>
                      <TableCell className="text-right text-sm font-extrabold text-purple-900 bg-purple-200">{formatCurrency(summaryTotals.totalGeral)}</TableCell>
                      <TableCell className={`text-right text-sm font-extrabold border-l border-purple-300 ${summaryTotals.totalLiquidoPagar < 0 ? 'text-red-700 bg-red-100' : 'text-purple-900 bg-purple-300'}`}>
                        {formatCurrency(summaryTotals.totalLiquidoPagar)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/Tablet: Card view per barber with all categories */}
              <div className="lg:hidden divide-y divide-purple-100">
                {barberSummaries.map(s => (
                  <div key={s.barber.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={s.barber.foto_url || ''} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                          {s.barber.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{s.barber.nome}</p>
                        <p className="text-[10px] text-gray-500">
                          Taxa: {s.barber.taxa_comissao || 0}% • {s.qtdComissoes} com.
                          {s.qtdVales > 0 && <span className="text-orange-600 font-medium"> • {s.qtdVales} vale{s.qtdVales > 1 ? 's' : ''}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Serviços */}
                      <div className="bg-blue-50 rounded p-1.5 border border-blue-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Scissors className="h-3 w-3 text-blue-700" />
                          <span className="text-[10px] font-semibold text-blue-900">Serviços</span>
                        </div>
                        <div className="text-[10px] text-green-700 flex justify-between">
                          <span>Pago</span><span className="font-semibold">{formatCurrency(s.servicoPago)}</span>
                        </div>
                        <div className="text-[10px] text-yellow-700 flex justify-between">
                          <span>Pend.</span><span className="font-semibold">{formatCurrency(s.servicoPendente)}</span>
                        </div>
                      </div>
                      {/* Produtos */}
                      <div className="bg-purple-50 rounded p-1.5 border border-purple-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Package className="h-3 w-3 text-purple-700" />
                          <span className="text-[10px] font-semibold text-purple-900">Produtos</span>
                        </div>
                        <div className="text-[10px] text-green-700 flex justify-between">
                          <span>Pago</span><span className="font-semibold">{formatCurrency(s.produtoPago)}</span>
                        </div>
                        <div className="text-[10px] text-yellow-700 flex justify-between">
                          <span>Pend.</span><span className="font-semibold">{formatCurrency(s.produtoPendente)}</span>
                        </div>
                      </div>
                      {/* Gorjetas */}
                      <div className="bg-pink-50 rounded p-1.5 border border-pink-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Coins className="h-3 w-3 text-pink-700" />
                          <span className="text-[10px] font-semibold text-pink-900">Gorjetas</span>
                        </div>
                        <div className="text-[10px] text-green-700 flex justify-between">
                          <span>Paga</span><span className="font-semibold">{formatCurrency(s.gorjetaPaga)}</span>
                        </div>
                        <div className="text-[10px] text-yellow-700 flex justify-between">
                          <span>Pend.</span><span className="font-semibold">{formatCurrency(s.gorjetaPendente)}</span>
                        </div>
                      </div>
                      {/* Vales */}
                      <div className="bg-orange-50 rounded p-1.5 border border-orange-200">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-orange-700" />
                          <span className="text-[10px] font-semibold text-orange-900">Vales</span>
                        </div>
                        <div className="text-[10px] text-orange-700 flex justify-between">
                          <span>Pago</span><span className="font-semibold">{s.valePago > 0 ? `- ${formatCurrency(s.valePago)}` : formatCurrency(0)}</span>
                        </div>
                        <div className="text-[10px] text-orange-700 flex justify-between">
                          <span>Pend.</span><span className="font-semibold">{s.valePendente > 0 ? `- ${formatCurrency(s.valePendente)}` : formatCurrency(0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-purple-100">
                      <div className="bg-green-50 rounded p-1.5 text-center border border-green-200">
                        <p className="text-[9px] text-green-700 font-medium">TOTAL PAGO</p>
                        <p className="text-xs font-bold text-green-800">{formatCurrency(s.totalPago)}</p>
                      </div>
                      <div className="bg-yellow-50 rounded p-1.5 text-center border border-yellow-200">
                        <p className="text-[9px] text-yellow-700 font-medium">PENDENTE</p>
                        <p className="text-xs font-bold text-yellow-800">{formatCurrency(s.totalPendente)}</p>
                      </div>
                      <div className="bg-purple-50 rounded p-1.5 text-center border border-purple-200">
                        <p className="text-[9px] text-purple-700 font-medium">TOTAL BRUTO</p>
                        <p className="text-xs font-bold text-purple-900">{formatCurrency(s.totalGeral)}</p>
                      </div>
                      <div className={`rounded p-1.5 text-center border ${s.totalLiquidoPagar < 0 ? 'bg-red-100 border-red-300' : 'bg-purple-100 border-purple-400'}`}>
                        <p className={`text-[9px] font-medium ${s.totalLiquidoPagar < 0 ? 'text-red-700' : 'text-purple-700'}`}>A PAGAR (LÍQUIDO)</p>
                        <p className={`text-xs font-extrabold ${s.totalLiquidoPagar < 0 ? 'text-red-800' : 'text-purple-900'}`}>{formatCurrency(s.totalLiquidoPagar)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Detalhamento (AZUL) */}
        <TabsContent value="detalhes" key="detalhes-tab" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
          ) : (
            <Card className={`bg-white ${TAB_THEMES.detalhes.border} border-2 overflow-hidden`}>
              <CardHeader className={`${TAB_THEMES.detalhes.bg} border-b ${TAB_THEMES.detalhes.border} py-3`}>
                <CardTitle className={`text-sm font-bold ${TAB_THEMES.detalhes.text} flex items-center gap-2`}>
                  <FileText className="h-4 w-4" />
                  Detalhamento de Comissões — Linha a Linha
                </CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">
                  Cada lançamento individual com data, tipo, valor, status e origem.
                </p>
              </CardHeader>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={TAB_THEMES.detalhes.headerBg}>
                      <TableHead className="text-xs font-bold text-blue-900">Data</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900">Barbeiro</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900">Tipo</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900 text-right">Valor</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900">Status</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900">Pagamento</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900">Origem</TableHead>
                      <TableHead className="text-xs font-bold text-blue-900 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                          Nenhuma comissão encontrada com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCommissions.map((c, idx) => (
                        <TableRow key={c.id} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-gray-50/40 hover:bg-blue-50/50'}>
                          <TableCell className="text-xs">
                            {c.created_at ? format(parseISO(c.created_at), 'dd/MM/yy HH:mm') : '-'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{c.barber_name || '-'}</TableCell>
                          <TableCell>{getTipoBadge(c.tipo)}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">{formatCurrency(Number(c.valor || 0))}</TableCell>
                          <TableCell>{getStatusBadge(c.status)}</TableCell>
                          <TableCell className="text-xs">
                            {c.data_pagamento ? format(parseISO(c.data_pagamento), 'dd/MM/yy') : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{c.appointment_source || '-'}</TableCell>
                          <TableCell className="text-center">
                            {normalizeStatus(c.status) === 'pago' && (
                              <Button variant="ghost" size="sm" onClick={() => setReceiptCommission(c)} title="Gerar Recibo">
                                <Printer className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-blue-100">
                {filteredCommissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Nenhuma comissão encontrada.</div>
                ) : (
                  filteredCommissions.map(c => (
                    <div key={c.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">{c.barber_name || '-'}</span>
                        <span className="font-bold text-sm text-gray-900">{formatCurrency(Number(c.valor || 0))}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTipoBadge(c.tipo)}
                        {getStatusBadge(c.status)}
                        <span className="text-[10px] text-gray-400">
                          {c.created_at ? format(parseISO(c.created_at), 'dd/MM/yy HH:mm') : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{c.appointment_source || '-'}</span>
                        <div className="flex items-center gap-2">
                          {c.data_pagamento && <span>Pago: {format(parseISO(c.data_pagamento), 'dd/MM/yy')}</span>}
                          {normalizeStatus(c.status) === 'pago' && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReceiptCommission(c)}>
                              <Printer className="h-3 w-3 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredCommissions.length > 0 && (
                <div className="p-3 border-t border-blue-100 bg-blue-50 flex items-center justify-between text-xs">
                  <span className="text-blue-700">{filteredCommissions.length} registros</span>
                  <span className="font-semibold text-blue-900">
                    Total: {formatCurrency(filteredCommissions.reduce((s, c) => s + Number(c.valor || 0), 0))}
                  </span>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* TAB: Contas a Pagar (ÂMBAR) */}
        <TabsContent value="contas" key="contas-tab" className="mt-4">
          <Card className={`bg-white ${TAB_THEMES.contas.border} border-2 overflow-hidden`}>
            <CardHeader className={`${TAB_THEMES.contas.bg} border-b ${TAB_THEMES.contas.border} py-3`}>
              <CardTitle className={`text-sm font-bold ${TAB_THEMES.contas.text} flex items-center gap-2`}>
                <Receipt className="h-4 w-4" />
                Contas a Pagar — Comissões e Gorjetas ({monthLabel}/{selectedYear})
              </CardTitle>
              <p className="text-xs text-gray-600 mt-0.5">
                Registros lançados no módulo Contas a Pagar com categoria "Comissão" ou "Gorjeta".
              </p>
            </CardHeader>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={TAB_THEMES.contas.headerBg}>
                    <TableHead className="text-xs font-bold text-amber-900">Descrição</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Barbeiro</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Categoria</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900 text-right">Valor</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Vencimento</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Pagamento</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Status</TableHead>
                    <TableHead className="text-xs font-bold text-amber-900">Forma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagarComissoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                        Nenhuma conta a pagar de comissão neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contasPagarComissoes.map((cp: any, idx: number) => (
                      <TableRow key={cp.id} className={idx % 2 === 0 ? 'bg-white hover:bg-amber-50/50' : 'bg-gray-50/40 hover:bg-amber-50/50'}>
                        <TableCell className="text-xs font-medium max-w-[220px] truncate">{cp.descricao}</TableCell>
                        <TableCell className="text-xs">{cp.fornecedor || '-'}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                            {cp.categoria || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">{formatCurrency(Number(cp.valor || 0))}</TableCell>
                        <TableCell className="text-xs">
                          {cp.data_vencimento ? format(parseISO(cp.data_vencimento), 'dd/MM/yy') : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {cp.data_pagamento ? format(parseISO(cp.data_pagamento), 'dd/MM/yy') : '-'}
                        </TableCell>
                        <TableCell>
                          {cp.status === 'pago' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{cp.forma_pagamento || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-amber-100">
              {contasPagarComissoes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhuma conta a pagar neste período.</div>
              ) : (
                contasPagarComissoes.map((cp: any) => (
                  <div key={cp.id} className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-gray-900 line-clamp-2 flex-1">{cp.descricao}</span>
                      <span className="font-bold text-sm text-gray-900 flex-shrink-0">{formatCurrency(Number(cp.valor || 0))}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cp.status === 'pago' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">Pago</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]">Pendente</Badge>
                      )}
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                        {cp.categoria || '-'}
                      </Badge>
                      {cp.fornecedor && <span className="text-[10px] text-gray-500">{cp.fornecedor}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>Venc: {cp.data_vencimento ? format(parseISO(cp.data_vencimento), 'dd/MM/yy') : '-'}</span>
                      {cp.data_pagamento && <span>Pago: {format(parseISO(cp.data_pagamento), 'dd/MM/yy')}</span>}
                      {cp.forma_pagamento && <span>{cp.forma_pagamento}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {contasPagarComissoes.length > 0 && (
              <div className="p-3 border-t border-amber-100 bg-amber-50 flex items-center justify-between text-xs">
                <span className="text-amber-700">{contasPagarComissoes.length} registros</span>
                <span className="font-semibold text-amber-900">
                  Total: {formatCurrency(contasPagarComissoes.reduce((s: number, c: any) => s + Number(c.valor || 0), 0))}
                </span>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptCommission} onOpenChange={open => !open && setReceiptCommission(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" /> Recibo de Comissão
            </DialogTitle>
          </DialogHeader>
          {receiptCommission && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Barbeiro:</span><span className="font-semibold">{receiptCommission.barber_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tipo:</span><span>{receiptCommission.tipo}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Data:</span><span>{receiptCommission.created_at ? format(parseISO(receiptCommission.created_at), 'dd/MM/yyyy') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pagamento:</span><span>{receiptCommission.data_pagamento ? format(parseISO(receiptCommission.data_pagamento), 'dd/MM/yyyy') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Origem:</span><span>{receiptCommission.appointment_source || '-'}</span></div>
              <div className="text-center py-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{formatCurrency(Number(receiptCommission.valor || 0))}</p>
                <p className="text-xs text-green-600 mt-1">PAGO</p>
              </div>
              <Button onClick={handlePrintReceipt} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Printer className="h-4 w-4 mr-2" /> Imprimir Recibo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComissoesManager;
