import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Filter, TrendingUp, AlertCircle, Loader2, Receipt, Printer
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
  totalPago: number;
  totalPendente: number;
  totalGorjeta: number;
  totalGeral: number;
  qtdComissoes: number;
}

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
      return <Badge variant="outline" className="text-blue-700 border-blue-300">Serviço</Badge>;
    case 'produto':
      return <Badge variant="outline" className="text-purple-700 border-purple-300">Produto</Badge>;
    case 'gorjeta':
      return <Badge variant="outline" className="text-pink-700 border-pink-300">Gorjeta</Badge>;
    case 'plano':
      return <Badge variant="outline" className="text-indigo-700 border-indigo-300">Plano</Badge>;
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
  const [activeView, setActiveView] = useState('resumo');
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

  // Also fetch from contas_pagar with categoria='Comissão' for cross-reference
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
        .or('categoria.eq.Comissão,categoria.eq.comissao,categoria.ilike.%comiss%')
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

  // ─── Barber Summaries ─────────────────────────────────
  const barberSummaries = useMemo((): BarberSummary[] => {
    const map = new Map<string, BarberSummary>();

    for (const barber of barbers) {
      map.set(barber.id, {
        barber,
        totalPago: 0,
        totalPendente: 0,
        totalGorjeta: 0,
        totalGeral: 0,
        qtdComissoes: 0,
      });
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
        summary = { barber, totalPago: 0, totalPendente: 0, totalGorjeta: 0, totalGeral: 0, qtdComissoes: 0 };
        map.set(c.barber_id, summary);
      }

      const valor = Number(c.valor || 0);
      const status = normalizeStatus(c.status);

      // Gorjetas são contabilizadas separadamente, não entram em Pago/Pendente
      if (c.tipo === 'gorjeta') {
        summary.totalGorjeta += valor;
      } else if (status === 'pago') {
        summary.totalPago += valor;
      } else {
        summary.totalPendente += valor;
      }

      // Total Geral = Pago + Pendente + Gorjetas (sem dupla contagem)
      summary.totalGeral += valor;
      summary.qtdComissoes++;
    }

    return Array.from(map.values())
      .filter(s => s.qtdComissoes > 0 || s.barber.ativo)
      .sort((a, b) => b.totalGeral - a.totalGeral);
  }, [barbers, commissions]);

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
    const total = commissions.reduce((s, c) => s + Number(c.valor || 0), 0);
    const barbeirosAtivos = new Set(commissions.map(c => c.barber_id)).size;

    return { totalPago, totalPendente, totalGorjetas, total, barbeirosAtivos, qtd: commissions.length };
  }, [commissions]);

  // ─── Export Excel ─────────────────────────────────────
  const handleExportExcel = useCallback(() => {
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

    // Sheet 1: Resumo por Barbeiro
    const resumoData = barberSummaries.map(s => ({
      'Barbeiro': s.barber.nome,
      'Taxa Comissão (%)': s.barber.taxa_comissao || 0,
      'Total Pago (R$)': s.totalPago,
      'Total Pendente (R$)': s.totalPendente,
      'Total Gorjetas (R$)': s.totalGorjeta,
      'Total Geral (R$)': s.totalGeral,
      'Qtd Comissões': s.qtdComissoes,
    }));

    // Sheet 2: Detalhamento
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

    // Sheet 3: Contas a Pagar (Comissões)
    const contasPagarData = contasPagarComissoes.map((cp: any) => ({
      'Descrição': cp.descricao,
      'Fornecedor': cp.fornecedor || '-',
      'Valor (R$)': Number(cp.valor || 0),
      'Vencimento': cp.data_vencimento ? format(parseISO(cp.data_vencimento), 'dd/MM/yyyy') : '-',
      'Pagamento': cp.data_pagamento ? format(parseISO(cp.data_pagamento), 'dd/MM/yyyy') : '-',
      'Status': cp.status || '-',
      'Forma Pagamento': cp.forma_pagamento || '-',
    }));

    const wb = XLSX.utils.book_new();

    // KPI sheet
    const kpiSheet = XLSX.utils.aoa_to_sheet([
      ['RELATÓRIO DE COMISSÕES'],
      [`Período: ${monthLabel} / ${selectedYear}`],
      [`Gerado em: ${format(getNowInBrazil(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [],
      ['INDICADORES'],
      ['Total Geral', kpis.total],
      ['Total Pago', kpis.totalPago],
      ['Total Pendente', kpis.totalPendente],
      ['Total Gorjetas', kpis.totalGorjetas],
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
  }, [barberSummaries, filteredCommissions, contasPagarComissoes, kpis, selectedMonth, selectedYear]);

  // ─── Receipt Dialog ───────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────
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
            <Download className="h-4 w-4 mr-1" /> Excel
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { title: 'Total Geral', value: formatCurrency(kpis.total), icon: DollarSign, color: 'text-blue-700', bg: 'bg-blue-50' },
          { title: 'Total Pago', value: formatCurrency(kpis.totalPago), icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
          { title: 'Total Pendente', value: formatCurrency(kpis.totalPendente), icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { title: 'Gorjetas', value: formatCurrency(kpis.totalGorjetas), icon: TrendingUp, color: 'text-pink-700', bg: 'bg-pink-50' },
          { title: 'Barbeiros', value: kpis.barbeirosAtivos.toString(), icon: Users, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((card, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Resumo por Barbeiro / Detalhamento */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-auto">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Resumo por Barbeiro</span>
            <span className="sm:hidden">Resumo</span>
          </TabsTrigger>
          <TabsTrigger value="detalhes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Detalhamento</span>
            <span className="sm:hidden">Detalhe</span>
          </TabsTrigger>
          <TabsTrigger value="contas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">
            <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Contas a Pagar</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Resumo por Barbeiro */}
        <TabsContent value="resumo" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : barberSummaries.length === 0 ? (
            <Card className="bg-white border-gray-200"><CardContent className="p-8 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />Nenhuma comissão encontrada neste período.
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {barberSummaries.map(s => (
                <Card key={s.barber.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s.barber.foto_url || ''} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-sm">
                          {s.barber.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.barber.nome}</p>
                        <p className="text-xs text-gray-500">
                          Taxa: {s.barber.taxa_comissao || 0}% • {s.qtdComissoes} comissões
                        </p>
                      </div>
                      {!s.barber.ativo && <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Inativo</Badge>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">✓ Pago</span>
                        <span className="font-semibold text-green-700">{formatCurrency(s.totalPago)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-700">⏳ Pendente</span>
                        <span className="font-semibold text-yellow-700">{formatCurrency(s.totalPendente)}</span>
                      </div>
                      {s.totalGorjeta > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-pink-700">💰 Gorjetas</span>
                          <span className="font-semibold text-pink-700">{formatCurrency(s.totalGorjeta)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-1.5 border-t border-gray-100">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-gray-900">{formatCurrency(s.totalGeral)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Detalhamento */}
        <TabsContent value="detalhes" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <Card className="bg-white border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold">Data</TableHead>
                      <TableHead className="text-xs font-semibold">Barbeiro</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Valor</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Pagamento</TableHead>
                      <TableHead className="text-xs font-semibold">Origem</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Ações</TableHead>
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
                      filteredCommissions.map(c => (
                        <TableRow key={c.id} className="hover:bg-gray-50">
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
                                <Printer className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredCommissions.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <span>{filteredCommissions.length} registros</span>
                  <span className="font-semibold text-gray-700">
                    Total: {formatCurrency(filteredCommissions.reduce((s, c) => s + Number(c.valor || 0), 0))}
                  </span>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* TAB: Contas a Pagar (Comissões) */}
        <TabsContent value="contas" className="mt-4">
          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Contas a Pagar — Comissões ({monthLabel}/{selectedYear})
              </CardTitle>
              <p className="text-xs text-gray-500">Registros do módulo Contas a Pagar com categoria "Comissão"</p>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold">Descrição</TableHead>
                    <TableHead className="text-xs font-semibold">Fornecedor</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Valor</TableHead>
                    <TableHead className="text-xs font-semibold">Vencimento</TableHead>
                    <TableHead className="text-xs font-semibold">Pagamento</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Forma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagarComissoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        Nenhuma conta a pagar de comissão neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contasPagarComissoes.map((cp: any) => (
                      <TableRow key={cp.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{cp.descricao}</TableCell>
                        <TableCell className="text-xs">{cp.fornecedor || '-'}</TableCell>
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
            {contasPagarComissoes.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span>{contasPagarComissoes.length} registros</span>
                <span className="font-semibold text-gray-700">
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
