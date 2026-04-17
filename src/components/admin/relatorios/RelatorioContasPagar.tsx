import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Loader2, Search, X, Check, ChevronsUpDown, Wallet, CheckCircle2, Clock, Layers } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import MultiSelectFilter from './shared/MultiSelectFilter';
import PaymentMethodBar from './shared/PaymentMethodBar';

interface Props {
  filters: { mes: number; ano: number };
}

interface PayableRow {
  conta_id: string;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria_raw: string;
  categoria_label: string;
  fornecedor: string;
  descricao: string;
  // Vínculo (quando há venda associada)
  agendamento_data: string | null;
  agendamento_hora: string | null;
  cliente_nome: string;
  barbeiro_nome: string;
  servico_nome: string;
  // Valores
  valor: number;
  forma_pagamento: string;
  observacoes: string | null;
  status: string;
  status_label: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  comissao: 'Comissão (Serviço)',
  comissao_assinatura: 'Comissão (Assinatura)',
  gorjeta: 'Gorjeta',
  produto: 'Comissão (Produto)',
  fornecedor: 'Fornecedor',
  outros: 'Outros',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
};

const normalizePaymentMethod = (raw: string | null | undefined, observacoes?: string | null): string => {
  const s = (raw ? String(raw).toLowerCase().trim() : '');
  // Quando vazio: tenta inferir checkout administrativo pelas observações
  if (!s) {
    const obs = (observacoes || '').toLowerCase();
    if (obs.includes('checkout admin') || obs.includes('checkout administrativo') || obs.includes('cortesia')) {
      return 'Admin';
    }
    return '-';
  }
  if (s.includes('pix')) return 'PIX';
  if (s.includes('debit') || s.includes('débito') || s.includes('debito')) return 'Cartão de Débito';
  if (s.includes('credit') || s.includes('crédito') || s.includes('credito')) return 'Cartão de Crédito';
  if (s.includes('cash') || s.includes('dinheiro') || s.includes('especie') || s.includes('espécie')) return 'Dinheiro';
  if (s.includes('transfer')) return 'Transferência';
  if (s === 'admin') return 'Admin';
  if (s === 'cortesia') return 'Cortesia';
  return raw!.charAt(0).toUpperCase() + raw!.slice(1);
};

// Extrai venda_id da string de observações (formato: "id=<uuid>;...")
const extractVendaIdFromObs = (obs: string | null): string | null => {
  if (!obs) return null;
  const match = obs.match(/(?:^|;)id=([0-9a-f-]{36})/i);
  return match ? match[1] : null;
};

const RelatorioContasPagar: React.FC<Props> = ({ filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFornecedor, setFilterFornecedor] = useState<string>('todos');
  // Filtros multi-seleção (vazio = todos)
  const [filterCategoria, setFilterCategoria] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterFormaPgto, setFilterFormaPgto] = useState<string[]>([]);
  const [openFornecedor, setOpenFornecedor] = useState(false);

  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['relatorio-contas-pagar', filters],
    queryFn: async () => {
      // 1. Busca contas a pagar do período (por vencimento OU pagamento)
      const [byVencRes, byPagRes] = await Promise.all([
        supabase
          .from('contas_pagar')
          .select('id, descricao, fornecedor, categoria, valor, status, forma_pagamento, data_vencimento, data_pagamento, venda_id, observacoes, created_at')
          .gte('data_vencimento', startDate)
          .lte('data_vencimento', endDate),
        supabase
          .from('contas_pagar')
          .select('id, descricao, fornecedor, categoria, valor, status, forma_pagamento, data_vencimento, data_pagamento, venda_id, observacoes, created_at')
          .gte('data_pagamento', startDate)
          .lte('data_pagamento', endDate),
      ]);

      // Dedup por id
      const map = new Map<string, any>();
      [...(byVencRes.data || []), ...(byPagRes.data || [])].forEach(c => map.set(c.id, c));
      const contas = Array.from(map.values());

      // 2. Coleta venda_ids (campo direto OU extraído de observações)
      const vendaIds = Array.from(new Set(
        contas
          .map(c => c.venda_id || extractVendaIdFromObs(c.observacoes))
          .filter(Boolean) as string[]
      ));

      // 3. Busca agendamentos vinculados às vendas
      const agsRes = vendaIds.length > 0
        ? await supabase
            .from('painel_agendamentos')
            .select(`
              id, data, hora, venda_id,
              cliente:painel_clientes!painel_agendamentos_cliente_id_fkey(nome),
              barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(nome),
              servico:painel_servicos!painel_agendamentos_servico_id_fkey(nome)
            `)
            .in('venda_id', vendaIds)
        : { data: [] as any[] };

      const agsByVenda = new Map<string, any>();
      (agsRes.data || []).forEach((ag: any) => {
        if (ag.venda_id) agsByVenda.set(ag.venda_id, ag);
      });

      // 4. Monta linhas
      const result: PayableRow[] = contas.map((c: any) => {
        const vendaId = c.venda_id || extractVendaIdFromObs(c.observacoes);
        const ag = vendaId ? agsByVenda.get(vendaId) : null;

        const cliente = ag ? (Array.isArray(ag.cliente) ? ag.cliente[0] : ag.cliente) : null;
        const barbeiro = ag ? (Array.isArray(ag.barbeiro) ? ag.barbeiro[0] : ag.barbeiro) : null;
        const servico = ag ? (Array.isArray(ag.servico) ? ag.servico[0] : ag.servico) : null;

        const categoriaRaw = String(c.categoria || 'outros').toLowerCase();
        const categoriaLabel = CATEGORIA_LABELS[categoriaRaw] || (c.categoria || 'Outros');
        const statusRaw = String(c.status || 'pendente').toLowerCase();
        const statusLabel = STATUS_LABELS[statusRaw] || c.status || 'Pendente';

        return {
          conta_id: c.id,
          data_vencimento: c.data_vencimento,
          data_pagamento: c.data_pagamento,
          categoria_raw: categoriaRaw,
          categoria_label: categoriaLabel,
          fornecedor: (c.fornecedor || '').trim() || (barbeiro?.nome || '—'),
          descricao: c.descricao || '',
          agendamento_data: ag?.data || null,
          agendamento_hora: ag?.hora ? String(ag.hora).slice(0, 5) : null,
          cliente_nome: cliente?.nome || '—',
          barbeiro_nome: barbeiro?.nome || (c.fornecedor || '—'),
          servico_nome: servico?.nome || (categoriaRaw === 'gorjeta' ? 'Gorjeta' : categoriaRaw === 'produto' ? 'Produto' : '—'),
          valor: Number(c.valor || 0),
          forma_pagamento: c.forma_pagamento || '',
          observacoes: c.observacoes || null,
          status: statusRaw,
          status_label: statusLabel,
        };
      });

      // Ordena por data de vencimento desc
      result.sort((a, b) => {
        const da = a.data_vencimento || '';
        const db = b.data_vencimento || '';
        return db.localeCompare(da);
      });

      return result;
    },
  });

  const fornecedorOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.fornecedor).filter(n => n && n !== '—'))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rows]
  );
  const categoriaOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.categoria_label).filter(Boolean))).sort(),
    [rows]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.status_label).filter(Boolean))).sort(),
    [rows]
  );
  const formaPgtoOptions = useMemo(
    () => Array.from(new Set(rows.map(r => normalizePaymentMethod(r.forma_pagamento, r.observacoes)).filter(f => f && f !== '-'))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return rows.filter(r => {
      if (filterFornecedor !== 'todos' && r.fornecedor !== filterFornecedor) return false;
      // Multi-seleção: lista vazia = todos
      if (filterCategoria.length > 0 && !filterCategoria.includes(r.categoria_label)) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(r.status_label)) return false;
      if (filterFormaPgto.length > 0 && !filterFormaPgto.includes(normalizePaymentMethod(r.forma_pagamento, r.observacoes))) return false;
      if (term && !(
        r.fornecedor.toLowerCase().includes(term) ||
        r.descricao.toLowerCase().includes(term) ||
        r.cliente_nome.toLowerCase().includes(term) ||
        r.servico_nome.toLowerCase().includes(term)
      )) return false;
      return true;
    });
  }, [rows, searchTerm, filterFornecedor, filterCategoria, filterStatus, filterFormaPgto]);

  // Totais + breakdown por categoria + por forma de pagamento
  const totals = useMemo(() => {
    let totalPago = 0, totalPendente = 0, totalGeral = 0;
    const porCategoria: Record<string, { total: number; pago: number; pendente: number }> = {};
    const porFormaPgto: Record<string, number> = {};

    filtered.forEach(r => {
      totalGeral += r.valor;
      const isPago = r.status === 'pago';
      const isPend = r.status === 'pendente' || r.status === 'atrasado';
      if (isPago) totalPago += r.valor;
      else if (isPend) totalPendente += r.valor;

      const cat = r.categoria_label;
      if (!porCategoria[cat]) porCategoria[cat] = { total: 0, pago: 0, pendente: 0 };
      porCategoria[cat].total += r.valor;
      if (isPago) porCategoria[cat].pago += r.valor;
      if (isPend) porCategoria[cat].pendente += r.valor;

      if (isPago) {
        const forma = normalizePaymentMethod(r.forma_pagamento, r.observacoes);
        if (forma !== '-') porFormaPgto[forma] = (porFormaPgto[forma] || 0) + r.valor;
      }
    });
    return { totalPago, totalPendente, totalGeral, count: filtered.length, porCategoria, porFormaPgto };
  }, [filtered]);

  const hasActiveFilters =
    !!searchTerm ||
    filterFornecedor !== 'todos' ||
    filterCategoria.length > 0 ||
    filterStatus.length > 0 ||
    filterFormaPgto.length > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFornecedor('todos');
    setFilterCategoria([]);
    setFilterStatus([]);
    setFilterFormaPgto([]);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    try {
      // Date-only (yyyy-MM-dd) → dd/MM/yyyy sem horário
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR });
      }
      return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return d;
    }
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const wsData = filtered.map(r => ({
      'Vencimento': formatDate(r.data_vencimento),
      'Pagamento': r.data_pagamento ? formatDate(r.data_pagamento) : '-',
      'Categoria': r.categoria_label,
      'Fornecedor / Barbeiro': r.fornecedor,
      'Descrição': r.descricao,
      'Cliente (Agend.)': r.cliente_nome,
      'Serviço (Agend.)': r.servico_nome,
      'Data Agend.': r.agendamento_data ? formatDate(r.agendamento_data) : '-',
      'Hora Agend.': r.agendamento_hora || '-',
      'Forma de Pagamento': normalizePaymentMethod(r.forma_pagamento, r.observacoes),
      'Valor': r.valor,
      'Status': r.status_label,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);

    const colWidths = Object.keys(wsData[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, ...wsData.map(r => String((r as any)[key] || '').length + 2)),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Pagar');

    // Aba 2: Resumo
    const resumoSheet = [
      ['RELATÓRIO ANALÍTICO — CONTAS A PAGAR'],
      ['Período:', `${String(filters.mes).padStart(2, '0')}/${filters.ano}`],
      ['Gerado em:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      [''],
      ['RESUMO'],
      ['Total de Lançamentos:', totals.count],
      ['Total Pago:', totals.totalPago],
      ['Total Pendente/Atrasado:', totals.totalPendente],
      ['Total Geral:', totals.totalGeral],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoSheet);
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    XLSX.writeFile(wb, `analitico_contas_pagar_${filters.ano}_${String(filters.mes).padStart(2, '0')}.xlsx`);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = (autoTableModule as any).default || (autoTableModule as any).autoTable || autoTableModule;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Relatório Analítico — Contas a Pagar', 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${String(filters.mes).padStart(2, '0')}/${filters.ano}`, 14, 22);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 27);
    doc.text(
      `Total: ${formatCurrency(totals.totalGeral)} | Pago: ${formatCurrency(totals.totalPago)} | Pendente: ${formatCurrency(totals.totalPendente)}`,
      14, 32
    );

    const headers = [
      'Vencim.', 'Pagto.', 'Categoria', 'Fornecedor', 'Descrição', 'Cliente', 'Serviço',
      'Data Agend.', 'Forma Pgto', 'Valor', 'Status',
    ];

    const body = filtered.map(r => [
      formatDate(r.data_vencimento),
      r.data_pagamento ? formatDate(r.data_pagamento) : '-',
      r.categoria_label,
      r.fornecedor.length > 16 ? r.fornecedor.slice(0, 16) + '…' : r.fornecedor,
      r.descricao.length > 22 ? r.descricao.slice(0, 22) + '…' : r.descricao,
      r.cliente_nome.length > 14 ? r.cliente_nome.slice(0, 14) + '…' : r.cliente_nome,
      r.servico_nome.length > 14 ? r.servico_nome.slice(0, 14) + '…' : r.servico_nome,
      r.agendamento_data ? `${formatDate(r.agendamento_data)} ${r.agendamento_hora || ''}` : '-',
      normalizePaymentMethod(r.forma_pagamento, r.observacoes),
      formatCurrency(r.valor),
      r.status_label,
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 38,
      styles: { fontSize: 6, cellPadding: 1.4 },
      headStyles: { fillColor: [185, 28, 28], fontSize: 6 },
      alternateRowStyles: { fillColor: [253, 242, 242] },
      margin: { left: 5, right: 5 },
    });

    doc.save(`analitico_contas_pagar_${filters.ano}_${String(filters.mes).padStart(2, '0')}.pdf`);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Carregando contas a pagar...</span>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = (s: string) => {
    if (s === 'pago') return 'bg-green-100 text-green-800';
    if (s === 'pendente') return 'bg-yellow-100 text-yellow-800';
    if (s === 'atrasado') return 'bg-red-100 text-red-800';
    if (s === 'cancelado') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const categoriaBadge = (c: string) => {
    if (c === 'comissao') return 'bg-blue-100 text-blue-800';
    if (c === 'comissao_assinatura') return 'bg-purple-100 text-purple-800';
    if (c === 'gorjeta') return 'bg-pink-100 text-pink-800';
    if (c === 'produto') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Cards de totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Wallet className="h-3.5 w-3.5 text-rose-600" />
              <p className="text-[11px] text-rose-700 font-medium">Total Geral</p>
            </div>
            <p className="text-lg font-bold text-rose-900">{formatCurrency(totals.totalGeral)}</p>
            <p className="text-[10px] text-rose-600 mt-0.5">{totals.count} lançamentos</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <p className="text-[11px] text-green-700 font-medium">Pago</p>
            </div>
            <p className="text-lg font-bold text-green-900">{formatCurrency(totals.totalPago)}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              <p className="text-[11px] text-yellow-700 font-medium">Pendente</p>
            </div>
            <p className="text-lg font-bold text-yellow-900">{formatCurrency(totals.totalPendente)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Layers className="h-3.5 w-3.5 text-slate-600" />
              <p className="text-[11px] text-slate-700 font-medium">% Pago</p>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {totals.totalGeral > 0 ? `${((totals.totalPago / totals.totalGeral) * 100).toFixed(1)}%` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por categoria */}
      {Object.keys(totals.porCategoria).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Distribuição por categoria</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(totals.porCategoria)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([cat, d]) => (
                <div key={cat} className="border border-gray-100 rounded-md p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-gray-700 truncate" title={cat}>{cat}</span>
                    <span className="text-[11px] font-semibold text-gray-900 whitespace-nowrap ml-2">{formatCurrency(d.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-green-700">✓ {formatCurrency(d.pago)}</span>
                    <span className="text-yellow-700">⏳ {formatCurrency(d.pendente)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Barra por forma de pagamento (apenas pagas) */}
      <PaymentMethodBar
        data={totals.porFormaPgto}
        accent="rose"
        title="Pago por forma de pagamento"
      />

      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Analítico de Contas a Pagar — {filtered.length} registros
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={filtered.length === 0}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={filtered.length === 0}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Fornecedor (autocomplete) */}
          <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openFornecedor}
                className="w-full justify-between bg-white border-gray-300 h-9 text-xs font-normal"
              >
                <span className="truncate">
                  {filterFornecedor === 'todos' ? '👤 Todos os Fornecedores / Barbeiros' : filterFornecedor}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white" align="start">
              <Command>
                <CommandInput placeholder="Buscar fornecedor..." className="h-9 text-xs" />
                <CommandList>
                  <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="todos" onSelect={() => { setFilterFornecedor('todos'); setOpenFornecedor(false); }}>
                      <Check className={cn('mr-2 h-3.5 w-3.5', filterFornecedor === 'todos' ? 'opacity-100' : 'opacity-0')} />
                      Todos os Fornecedores
                    </CommandItem>
                    {fornecedorOptions.map(nome => (
                      <CommandItem key={nome} value={nome} onSelect={() => { setFilterFornecedor(nome); setOpenFornecedor(false); }}>
                        <Check className={cn('mr-2 h-3.5 w-3.5', filterFornecedor === nome ? 'opacity-100' : 'opacity-0')} />
                        {nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, cliente ou serviço..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <MultiSelectFilter
              placeholder="Categoria"
              options={categoriaOptions}
              selected={filterCategoria}
              onChange={setFilterCategoria}
              selectedLabel="categorias"
            />
            <MultiSelectFilter
              placeholder="Status"
              options={statusOptions}
              selected={filterStatus}
              onChange={setFilterStatus}
              selectedLabel="status"
            />
            <MultiSelectFilter
              placeholder="Forma Pgto"
              options={formaPgtoOptions}
              selected={filterFormaPgto}
              onChange={setFilterFormaPgto}
              selectedLabel="formas"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="h-9 text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar Filtros
            </Button>
          </div>

          {/* Legenda */}
          <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-[11px] text-gray-700 space-y-1">
            <p className="font-semibold text-rose-800 mb-1">📖 Legenda do Relatório:</p>
            <p><strong>Categoria:</strong>
              <span className="text-blue-700 ml-1">Comissão (Serviço)</span>,
              <span className="text-purple-700 ml-1">Comissão (Assinatura — uso de crédito)</span>,
              <span className="text-orange-700 ml-1">Comissão (Produto)</span>,
              <span className="text-pink-700 ml-1">Gorjeta</span>,
              <span className="text-gray-700 ml-1">Outros</span>.
            </p>
            <p><strong>Vínculo de Agendamento:</strong> Quando o lançamento está vinculado a uma venda, exibimos o cliente, serviço, data e hora do agendamento original.</p>
            <p><strong>Status:</strong>
              <span className="text-green-700 ml-1 font-medium">Pago</span> = comissão/gorjeta já quitada com o barbeiro.
              <span className="text-yellow-700 ml-1 font-medium">Pendente</span> = aguardando pagamento.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-[11px] border-collapse [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1.5 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-left [&_th]:bg-gray-50 [&_tr]:border-b [&_tr]:border-gray-100">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Vencimento</th>
                  <th className="whitespace-nowrap">Pagamento</th>
                  <th>Categoria</th>
                  <th>Fornecedor / Barbeiro</th>
                  <th>Descrição</th>
                  <th>Cliente (Agend.)</th>
                  <th>Serviço (Agend.)</th>
                  <th className="whitespace-nowrap">Data Agend.</th>
                  <th>Forma Pgto</th>
                  <th className="text-right">Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400">
                      Nenhum lançamento encontrado para o período/filtros.
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.conta_id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap">{formatDate(r.data_vencimento)}</td>
                      <td className="whitespace-nowrap">{r.data_pagamento ? formatDate(r.data_pagamento) : '-'}</td>
                      <td>
                        <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-medium', categoriaBadge(r.categoria_raw))}>
                          {r.categoria_label}
                        </span>
                      </td>
                      <td className="font-medium text-gray-800">{r.fornecedor}</td>
                      <td className="max-w-[220px] truncate" title={r.descricao}>{r.descricao}</td>
                      <td>{r.cliente_nome}</td>
                      <td>{r.servico_nome}</td>
                      <td className="whitespace-nowrap text-gray-600">
                        {r.agendamento_data ? `${formatDate(r.agendamento_data)} ${r.agendamento_hora || ''}` : '-'}
                      </td>
                      <td>{normalizePaymentMethod(r.forma_pagamento, r.observacoes)}</td>
                      <td className="text-right font-semibold text-rose-700">{formatCurrency(r.valor)}</td>
                      <td>
                        <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-medium', statusBadge(r.status))}>
                          {r.status_label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioContasPagar;
