import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Loader2, Search, X, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  filters: { mes: number; ano: number };
}

interface AnalyticalRow {
  agendamento_id: string;
  data_agendamento: string;
  hora: string;
  cliente_nome: string;
  barbeiro_nome: string;
  servico_nome: string;
  servicos_extras: string;
  status_agendamento: string;
  data_checkin: string | null;
  data_checkout: string | null;
  origem_checkout: string;
  forma_pagamento: string;
  valor_servico: number;
  desconto: number;
  gorjeta: number;
  valor_total: number;
  valor_recebido: number;
  comissao_barbeiro: number;
  status_pagamento: string;
}

const statusMap: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  no_show: 'Não compareceu',
};

// Normaliza forma de pagamento para nomenclatura amigável e consistente
const normalizePaymentMethod = (raw: string | null | undefined): string => {
  if (!raw) return '-';
  const s = String(raw).toLowerCase().trim();
  if (s.includes('pix')) return 'PIX';
  if (s.includes('credit') || s.includes('crédito') || s.includes('credito')) return 'Cartão de Crédito';
  if (s.includes('debit') || s.includes('débito') || s.includes('debito')) return 'Cartão de Débito';
  if (s.includes('cash') || s.includes('dinheiro') || s.includes('especie') || s.includes('espécie')) return 'Dinheiro';
  if (s.includes('subscription') || s.includes('assinatura') || s.includes('credit_subscription') || s.includes('plano')) return 'Crédito de Assinatura';
  if (s.includes('cortesia') || s.includes('courtesy') || s.includes('free')) return 'Cortesia';
  if (s.includes('transfer')) return 'Transferência';
  // Fallback: capitaliza
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const RelatorioAnalitico: React.FC<Props> = ({ filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState<string>('todos');
  const [filterBarbeiro, setFilterBarbeiro] = useState<string>('todos');
  const [openCliente, setOpenCliente] = useState(false);
  const [openBarbeiro, setOpenBarbeiro] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterOrigem, setFilterOrigem] = useState<string>('todos');
  const [filterFormaPgto, setFilterFormaPgto] = useState<string>('todos');
  const [filterStatusPgto, setFilterStatusPgto] = useState<string>('todos');
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['relatorio-analitico', filters],
    queryFn: async () => {
      // 1. Fetch appointments with explicit relations
      const { data: agendamentos = [] } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, status_totem, updated_at, created_at,
          cliente_id, barbeiro_id, servico_id, venda_id, servicos_extras,
          cliente:painel_clientes!painel_agendamentos_cliente_id_fkey(id, nome),
          barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(id, nome),
          servico:painel_servicos!painel_agendamentos_servico_id_fkey(id, nome, preco)
        `)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      const ags = agendamentos || [];
      const vendaIds = ags.map((a: any) => a.venda_id).filter(Boolean);
      const agendamentoIds = ags.map((a: any) => a.id);

      // 2. Fetch related data in parallel
      const [vendasRes, vendasItensRes, commissionsRes, comissoesRes, contasReceberRes, totemSessionsRes] = await Promise.all([
        vendaIds.length > 0
          ? supabase
              .from('vendas')
              .select('id, valor_total, desconto, gorjeta, forma_pagamento, status, observacoes, created_at, updated_at')
              .in('id', vendaIds)
          : Promise.resolve({ data: [] as any[] }),
        vendaIds.length > 0
          ? supabase
              .from('vendas_itens')
              .select('venda_id, nome, tipo, quantidade, preco_unitario, subtotal')
              .in('venda_id', vendaIds)
          : Promise.resolve({ data: [] as any[] }),
        // barber_commissions: pode vir por appointment_id OU venda_id
        supabase
          .from('barber_commissions')
          .select('id, appointment_id, venda_id, valor, status')
          .or(
            [
              agendamentoIds.length > 0 ? `appointment_id.in.(${agendamentoIds.join(',')})` : '',
              vendaIds.length > 0 ? `venda_id.in.(${vendaIds.join(',')})` : '',
            ].filter(Boolean).join(',')
          ),
        vendaIds.length > 0
          ? supabase
              .from('comissoes')
              .select('venda_id, valor, status')
              .in('venda_id', vendaIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from('contas_receber')
          .select('id, valor, status, forma_pagamento, data_recebimento, descricao')
          .gte('data_vencimento', startDate)
          .lte('data_vencimento', endDate),
        // Sessões de totem para identificar origem do checkout E o horário exato de check-in
        agendamentoIds.length > 0
          ? supabase
              .from('appointment_totem_sessions')
              .select('appointment_id, status, totem_session_id, created_at')
              .in('appointment_id', agendamentoIds)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const vendas = vendasRes.data || [];
      const vendasItens = vendasItensRes.data || [];
      const commissions = commissionsRes.data || [];
      const comissoesLegacy = comissoesRes.data || [];
      const contasReceber = contasReceberRes.data || [];
      const totemSessions = totemSessionsRes.data || [];

      // Mapa: appointment_id -> data exata de check-in (primeira sessão criada no totem)
      const checkinMap = new Map<string, string>();
      const totemAppointments = new Set<string>();
      totemSessions.forEach((t: any) => {
        if (!checkinMap.has(t.appointment_id)) {
          checkinMap.set(t.appointment_id, t.created_at);
        }
        totemAppointments.add(t.appointment_id);
      });

      // Build maps
      const vendasMap = new Map(vendas.map((v: any) => [v.id, v]));
      const itensByVenda = new Map<string, any[]>();
      vendasItens.forEach((it: any) => {
        const arr = itensByVenda.get(it.venda_id) || [];
        arr.push(it);
        itensByVenda.set(it.venda_id, arr);
      });

      // Comissões por appointment_id e venda_id
      const comissaoByAppointment = new Map<string, number>();
      const comissaoByVenda = new Map<string, number>();
      commissions.forEach((c: any) => {
        if (c.appointment_id) {
          comissaoByAppointment.set(c.appointment_id, (comissaoByAppointment.get(c.appointment_id) || 0) + Number(c.valor || 0));
        }
        if (c.venda_id) {
          comissaoByVenda.set(c.venda_id, (comissaoByVenda.get(c.venda_id) || 0) + Number(c.valor || 0));
        }
      });
      comissoesLegacy.forEach((c: any) => {
        if (c.venda_id && !comissaoByVenda.has(c.venda_id)) {
          comissaoByVenda.set(c.venda_id, (comissaoByVenda.get(c.venda_id) || 0) + Number(c.valor || 0));
        }
      });

      // 3. Build rows
      const result: AnalyticalRow[] = ags.map((ag: any) => {
        const cliente = Array.isArray(ag.cliente) ? ag.cliente[0] : ag.cliente;
        const barbeiro = Array.isArray(ag.barbeiro) ? ag.barbeiro[0] : ag.barbeiro;
        const servico = Array.isArray(ag.servico) ? ag.servico[0] : ag.servico;

        const clienteNome = cliente?.nome || 'N/A';
        const barbeiroNome = barbeiro?.nome || 'N/A';
        const servicoNome = servico?.nome || 'N/A';

        const venda: any = ag.venda_id ? vendasMap.get(ag.venda_id) : null;
        const itens = ag.venda_id ? (itensByVenda.get(ag.venda_id) || []) : [];

        // Extras: prioriza vendas_itens (excluindo o serviço principal), senão usa servicos_extras
        let extrasArr: string[] = [];
        if (itens.length > 0) {
          const principalNome = servicoNome.toLowerCase();
          extrasArr = itens
            .filter((it: any) => {
              const nome = (it.nome || '').toLowerCase();
              // Pula o serviço principal (apenas o primeiro match)
              return nome !== principalNome;
            })
            .map((it: any) => {
              const qtd = it.quantidade > 1 ? `${it.quantidade}x ` : '';
              return `${qtd}${it.nome}`;
            });
          // Remove o primeiro item igual ao principal apenas uma vez
          const idxPrincipal = itens.findIndex((it: any) => (it.nome || '').toLowerCase() === principalNome);
          if (idxPrincipal === -1 && itens.length > 1) {
            // Se não encontrou principal, considera o primeiro como principal
            extrasArr = itens.slice(1).map((it: any) => {
              const qtd = it.quantidade > 1 ? `${it.quantidade}x ` : '';
              return `${qtd}${it.nome}`;
            });
          }
        } else if (ag.servicos_extras && Array.isArray(ag.servicos_extras)) {
          extrasArr = (ag.servicos_extras as any[])
            .map((e: any) => e.nome || e.name || '')
            .filter(Boolean);
        }
        const extrasStr = extrasArr.join(', ');

        // Check-in: prioriza data exata da sessão de totem; fallback para updated_at se status indica chegada
        const hasCheckin =
          ag.status_totem === 'CHEGOU' ||
          ag.status_totem === 'FINALIZADO' ||
          ag.status === 'confirmado' ||
          ag.status === 'concluido';
        const dataCheckin = checkinMap.get(ag.id) || (hasCheckin ? (ag.updated_at || ag.created_at) : null);

        // Checkout: momento exato em que a venda foi criada (finalização do checkout)
        const dataCheckout = venda ? (venda.created_at || venda.updated_at) : null;

        // Pagamento (normaliza status case-insensitive: aceita 'pago' e 'PAGA')
        const vendaStatusLower = String(venda?.status || '').toLowerCase();
        const vendaPaga = vendaStatusLower === 'pago' || vendaStatusLower === 'paga';
        const vendaObs = String(venda?.observacoes || '').toLowerCase();
        const isAdminCheckout = vendaObs.includes('checkout administrativo') || vendaObs.includes('cortesia administrativa');
        const isAdminCortesia = vendaObs.includes('cortesia administrativa');

        const formaPagamento = venda ? (venda.forma_pagamento || '') : '';
        const valorServico = Number(servico?.preco || 0);
        const desconto = venda ? Number(venda.desconto || 0) : 0;
        const gorjeta = venda ? Number(venda.gorjeta || 0) : 0;
        const valorTotal = venda ? Number(venda.valor_total || 0) : valorServico;

        // Recebido
        const contaReceber = contasReceber.find(
          (cr: any) => cr.descricao?.includes(ag.id) || (venda && cr.descricao?.includes(venda.id))
        );
        const valorRecebido = contaReceber
          ? Number(contaReceber.valor)
          : vendaPaga
          ? valorTotal
          : 0;

        // Comissão (tenta por appointment_id, depois por venda_id)
        const comissaoValor =
          comissaoByAppointment.get(ag.id) ||
          (ag.venda_id ? comissaoByVenda.get(ag.venda_id) || 0 : 0);

        // Detecta cortesia: forma de pagamento "cortesia", obs admin de cortesia, OU venda paga com valor zero
        const formaLower = String(formaPagamento || '').toLowerCase();
        const isCortesia = !!venda && (
          formaLower.includes('cortesia') ||
          formaLower.includes('courtesy') ||
          formaLower.includes('free') ||
          isAdminCortesia ||
          (vendaPaga && Number(valorTotal) === 0)
        );

        // Status do pagamento - mais didático
        let statusPagamento: string;
        if (ag.status === 'cancelado') {
          statusPagamento = 'Cancelado';
        } else if (isCortesia) {
          // Cortesia sempre conta como pago (valor zerado é esperado)
          statusPagamento = 'Cortesia (Pago)';
        } else if (venda) {
          statusPagamento = vendaPaga ? 'Pago (Recebido)' : 'Aguardando Pagamento';
        } else if (ag.status === 'concluido') {
          statusPagamento = 'Concluído sem Cobrança';
        } else {
          statusPagamento = 'Sem Checkout';
        }

        // Origem do checkout: Admin (manual) tem prioridade — identificado pela observação da venda.
        // O admin override também cria sessão no totem por baixo dos panos, então não dá pra
        // confiar só em appointment_totem_sessions.
        let origemCheckout = '-';
        if (venda) {
          if (isAdminCheckout) {
            origemCheckout = 'Admin (Manual)';
          } else if (totemAppointments.has(ag.id)) {
            origemCheckout = 'Totem';
          } else {
            origemCheckout = 'Admin (Manual)';
          }
        }

        // Forma de pagamento exibida: cortesia explícita > forma original > 'Cortesia' (admin sem forma)
        const formaPagamentoDisplay = isCortesia
          ? 'cortesia'
          : (formaPagamento || (isAdminCheckout ? 'admin' : ''));

        return {
          agendamento_id: ag.id,
          data_agendamento: ag.data,
          hora: typeof ag.hora === 'string' ? ag.hora.slice(0, 5) : String(ag.hora),
          cliente_nome: clienteNome,
          barbeiro_nome: barbeiroNome,
          servico_nome: servicoNome,
          servicos_extras: extrasStr,
          status_agendamento: statusMap[ag.status || ''] || ag.status || '',
          data_checkin: dataCheckin,
          data_checkout: dataCheckout,
          origem_checkout: origemCheckout,
          forma_pagamento: isCortesia ? 'cortesia' : formaPagamento,
          valor_servico: valorServico,
          desconto,
          gorjeta,
          valor_total: valorTotal,
          valor_recebido: isCortesia ? 0 : valorRecebido,
          comissao_barbeiro: comissaoValor,
          status_pagamento: statusPagamento,
        };
      });

      return result;
    },
  });

  // Listas únicas para os selects de filtro
  const clienteOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.cliente_nome).filter(n => n && n !== 'N/A'))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rows]
  );
  const barbeiroOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.barbeiro_nome).filter(n => n && n !== 'N/A'))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rows]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.status_agendamento).filter(Boolean))).sort(),
    [rows]
  );
  const origemOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.origem_checkout).filter(o => o && o !== '-'))).sort(),
    [rows]
  );
  const formaPgtoOptions = useMemo(
    () => Array.from(new Set(rows.map(r => normalizePaymentMethod(r.forma_pagamento)).filter(f => f && f !== '-'))).sort(),
    [rows]
  );
  const statusPgtoOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.status_pagamento).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return rows.filter(r => {
      if (filterCliente !== 'todos' && r.cliente_nome !== filterCliente) return false;
      if (filterBarbeiro !== 'todos' && r.barbeiro_nome !== filterBarbeiro) return false;
      if (term && !(
        r.cliente_nome.toLowerCase().includes(term) ||
        r.barbeiro_nome.toLowerCase().includes(term) ||
        r.servico_nome.toLowerCase().includes(term) ||
        r.servicos_extras.toLowerCase().includes(term)
      )) return false;
      if (filterStatus !== 'todos' && r.status_agendamento !== filterStatus) return false;
      if (filterOrigem !== 'todos' && r.origem_checkout !== filterOrigem) return false;
      if (filterFormaPgto !== 'todos' && normalizePaymentMethod(r.forma_pagamento) !== filterFormaPgto) return false;
      if (filterStatusPgto !== 'todos' && r.status_pagamento !== filterStatusPgto) return false;
      return true;
    });
  }, [rows, searchTerm, filterCliente, filterBarbeiro, filterStatus, filterOrigem, filterFormaPgto, filterStatusPgto]);

  const hasActiveFilters =
    !!searchTerm ||
    filterCliente !== 'todos' ||
    filterBarbeiro !== 'todos' ||
    filterStatus !== 'todos' ||
    filterOrigem !== 'todos' ||
    filterFormaPgto !== 'todos' ||
    filterStatusPgto !== 'todos';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCliente('todos');
    setFilterBarbeiro('todos');
    setFilterStatus('todos');
    setFilterOrigem('todos');
    setFilterFormaPgto('todos');
    setFilterStatusPgto('todos');
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    try {
      return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      try {
        return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return d;
      }
    }
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const wsData = filtered.map(r => ({
      'Data Agendamento': format(new Date(r.data_agendamento), 'dd/MM/yyyy', { locale: ptBR }),
      'Hora': r.hora,
      'Cliente': r.cliente_nome,
      'Barbeiro': r.barbeiro_nome,
      'Serviço': r.servico_nome,
      'Extras': r.servicos_extras,
      'Status Agendamento': r.status_agendamento,
      'Data Check-in': r.data_checkin ? formatDate(r.data_checkin) : '-',
      'Data Checkout': r.data_checkout ? formatDate(r.data_checkout) : '-',
      'Origem do Checkout': r.origem_checkout,
      'Forma de Pagamento': normalizePaymentMethod(r.forma_pagamento),
      'Valor Serviço': r.valor_servico,
      'Desconto': r.desconto,
      'Gorjeta': r.gorjeta,
      'Valor Total': r.valor_total,
      'Valor Recebido (Cliente)': r.valor_recebido,
      'Comissão Barbeiro': r.comissao_barbeiro,
      'Status Pagamento': r.status_pagamento,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);

    const colWidths = Object.keys(wsData[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, ...wsData.map(r => String((r as any)[key] || '').length + 2)),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Analítico');
    XLSX.writeFile(wb, `relatorio_analitico_${filters.ano}_${String(filters.mes).padStart(2, '0')}.xlsx`);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.text('Relatório Analítico de Agendamentos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${String(filters.mes).padStart(2, '0')}/${filters.ano}`, 14, 22);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 27);

    const headers = [
      'Data', 'Hora', 'Cliente', 'Barbeiro', 'Serviço', 'Extras', 'Status',
      'Check-in', 'Checkout', 'Origem', 'Forma Pgto', 'Valor', 'Desc.', 'Gorj.', 'Total',
      'Recebido', 'Comissão', 'Status Pgto',
    ];

    const body = filtered.map(r => [
      format(new Date(r.data_agendamento), 'dd/MM', { locale: ptBR }),
      r.hora,
      r.cliente_nome.length > 12 ? r.cliente_nome.slice(0, 12) + '…' : r.cliente_nome,
      r.barbeiro_nome.length > 9 ? r.barbeiro_nome.slice(0, 9) + '…' : r.barbeiro_nome,
      r.servico_nome.length > 12 ? r.servico_nome.slice(0, 12) + '…' : r.servico_nome,
      r.servicos_extras.length > 12 ? r.servicos_extras.slice(0, 12) + '…' : r.servicos_extras || '-',
      r.status_agendamento.slice(0, 9),
      r.data_checkin ? format(new Date(r.data_checkin), 'dd/MM HH:mm') : '-',
      r.data_checkout ? format(new Date(r.data_checkout), 'dd/MM HH:mm') : '-',
      r.origem_checkout,
      normalizePaymentMethod(r.forma_pagamento),
      formatCurrency(r.valor_servico),
      formatCurrency(r.desconto),
      formatCurrency(r.gorjeta),
      formatCurrency(r.valor_total),
      formatCurrency(r.valor_recebido),
      formatCurrency(r.comissao_barbeiro),
      r.status_pagamento,
    ]);

    (doc as any).autoTable({
      head: [headers],
      body,
      startY: 32,
      styles: { fontSize: 5.5, cellPadding: 1.2 },
      headStyles: { fillColor: [55, 65, 81], fontSize: 5.5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 5, right: 5 },
    });

    doc.save(`relatorio_analitico_${filters.ano}_${String(filters.mes).padStart(2, '0')}.pdf`);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Carregando relatório analítico...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Relatório Analítico — {filtered.length} registros
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
          {/* Selectores dedicados de Cliente e Barbeiro (autocomplete) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Popover open={openCliente} onOpenChange={setOpenCliente}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCliente}
                  className="w-full justify-between bg-white border-gray-300 h-9 text-xs font-normal"
                >
                  <span className="truncate">
                    {filterCliente === 'todos' ? '👤 Todos os Clientes' : filterCliente}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." className="h-9 text-xs" />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos"
                        onSelect={() => { setFilterCliente('todos'); setOpenCliente(false); }}
                      >
                        <Check className={cn('mr-2 h-3.5 w-3.5', filterCliente === 'todos' ? 'opacity-100' : 'opacity-0')} />
                        Todos os Clientes
                      </CommandItem>
                      {clienteOptions.map(nome => (
                        <CommandItem
                          key={nome}
                          value={nome}
                          onSelect={() => { setFilterCliente(nome); setOpenCliente(false); }}
                        >
                          <Check className={cn('mr-2 h-3.5 w-3.5', filterCliente === nome ? 'opacity-100' : 'opacity-0')} />
                          {nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover open={openBarbeiro} onOpenChange={setOpenBarbeiro}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBarbeiro}
                  className="w-full justify-between bg-white border-gray-300 h-9 text-xs font-normal"
                >
                  <span className="truncate">
                    {filterBarbeiro === 'todos' ? '✂️ Todos os Barbeiros' : filterBarbeiro}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white" align="start">
                <Command>
                  <CommandInput placeholder="Buscar barbeiro..." className="h-9 text-xs" />
                  <CommandList>
                    <CommandEmpty>Nenhum barbeiro encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos"
                        onSelect={() => { setFilterBarbeiro('todos'); setOpenBarbeiro(false); }}
                      >
                        <Check className={cn('mr-2 h-3.5 w-3.5', filterBarbeiro === 'todos' ? 'opacity-100' : 'opacity-0')} />
                        Todos os Barbeiros
                      </CommandItem>
                      {barbeiroOptions.map(nome => (
                        <CommandItem
                          key={nome}
                          value={nome}
                          onSelect={() => { setFilterBarbeiro(nome); setOpenBarbeiro(false); }}
                        >
                          <Check className={cn('mr-2 h-3.5 w-3.5', filterBarbeiro === nome ? 'opacity-100' : 'opacity-0')} />
                          {nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por serviço ou extras..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>

          {/* Filtros funcionais */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white border-gray-300 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="todos">Todos os Status</SelectItem>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterOrigem} onValueChange={setFilterOrigem}>
              <SelectTrigger className="bg-white border-gray-300 h-9 text-xs">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="todos">Todas Origens</SelectItem>
                {origemOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterFormaPgto} onValueChange={setFilterFormaPgto}>
              <SelectTrigger className="bg-white border-gray-300 h-9 text-xs">
                <SelectValue placeholder="Forma Pgto" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="todos">Todas Formas</SelectItem>
                {formaPgtoOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStatusPgto} onValueChange={setFilterStatusPgto}>
              <SelectTrigger className="bg-white border-gray-300 h-9 text-xs">
                <SelectValue placeholder="Status Pgto" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="todos">Todos Pgtos</SelectItem>
                {statusPgtoOptions.map(sp => <SelectItem key={sp} value={sp}>{sp}</SelectItem>)}
              </SelectContent>
            </Select>

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
          {/* Legenda explicativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-[11px] text-gray-700 space-y-1">
            <p className="font-semibold text-blue-800 mb-1">📖 Legenda do Relatório:</p>
            <p><strong>Status Pgto:</strong> Refere-se ao <em>pagamento do cliente</em> (Contas a Receber), <strong>não</strong> ao pagamento de comissão do barbeiro.</p>
            <p>• <span className="text-green-700 font-medium">Pago (Recebido)</span> = cliente pagou e o valor entrou no caixa.</p>
            <p>• <span className="text-purple-700 font-medium">Cortesia (Pago)</span> = atendimento gratuito autorizado. Considerado <strong>quitado</strong> (valor R$ 0,00 esperado).</p>
            <p>• <span className="text-yellow-700 font-medium">Aguardando Pagamento</span> = checkout iniciado mas ainda não foi pago.</p>
            <p>• <span className="text-red-700 font-medium">Cancelado</span> = agendamento cancelado.</p>
            <p>• <span className="text-orange-700 font-medium">Concluído sem Cobrança</span> = atendido mas sem registro de venda.</p>
            <p><strong>Origem Checkout:</strong> <span className="text-teal-700">Totem</span> (cliente finalizou no totem) ou <span className="text-indigo-700">Admin (Manual)</span> (finalizado pelo administrador).</p>
            <p><strong>Forma de Pagamento:</strong> Dinheiro, PIX, Cartão de Débito, Cartão de Crédito, Crédito de Assinatura (uso de plano), Cortesia.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-[11px] border-collapse [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1.5 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-left [&_th]:bg-gray-50 [&_tr]:border-b [&_tr]:border-gray-100">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Data / Hora</th>
                  <th>Cliente</th>
                  <th>Barbeiro</th>
                  <th>Serviço</th>
                  <th>Extras</th>
                  <th className="whitespace-nowrap">Status</th>
                  <th className="whitespace-nowrap">Check-in / Checkout</th>
                  <th className="whitespace-nowrap">Origem</th>
                  <th className="whitespace-nowrap">Forma Pgto</th>
                  <th className="text-right whitespace-nowrap">Valor</th>
                  <th className="text-right whitespace-nowrap" title="Desconto / Gorjeta">Desc / Gorj</th>
                  <th className="text-right whitespace-nowrap">Total</th>
                  <th className="text-right whitespace-nowrap" title="Recebido do cliente">Recebido</th>
                  <th className="text-right whitespace-nowrap" title="Comissão devida ao barbeiro">Comissão</th>
                  <th className="whitespace-nowrap" title="Status do pagamento do cliente (não da comissão)">Status Pgto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-gray-500">
                      Nenhum agendamento encontrado para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.agendamento_id} className="hover:bg-gray-50 align-top">
                      <td className="whitespace-nowrap">
                        <div className="font-medium text-gray-800">{format(new Date(r.data_agendamento), 'dd/MM/yy', { locale: ptBR })}</div>
                        <div className="text-[10px] text-gray-500">{r.hora}</div>
                      </td>
                      <td className="max-w-[140px] truncate" title={r.cliente_nome}>{r.cliente_nome}</td>
                      <td className="max-w-[110px] truncate" title={r.barbeiro_nome}>{r.barbeiro_nome}</td>
                      <td className="max-w-[130px] truncate" title={r.servico_nome}>{r.servico_nome}</td>
                      <td className="max-w-[130px] truncate text-gray-500" title={r.servicos_extras}>{r.servicos_extras || '-'}</td>
                      <td>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                          r.status_agendamento === 'Concluído' ? 'bg-green-100 text-green-700' :
                          r.status_agendamento === 'Cancelado' ? 'bg-red-100 text-red-700' :
                          r.status_agendamento === 'Confirmado' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status_agendamento}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-[10px] leading-tight">
                        <div><span className="text-gray-400">In:</span> <span className="text-gray-700">{formatDate(r.data_checkin)}</span></div>
                        <div><span className="text-gray-400">Out:</span> <span className="text-gray-700">{formatDate(r.data_checkout)}</span></div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.origem_checkout === 'Totem' ? 'bg-teal-100 text-teal-700' :
                          r.origem_checkout === 'Admin (Manual)' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-500'
                        }`} title={r.origem_checkout}>
                          {r.origem_checkout === 'Totem' ? '🖥️ Totem' :
                           r.origem_checkout === 'Admin (Manual)' ? '👤 Admin' :
                           r.origem_checkout}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-[10px]">
                        {normalizePaymentMethod(r.forma_pagamento)}
                      </td>
                      <td className="text-right whitespace-nowrap tabular-nums">{formatCurrency(r.valor_servico)}</td>
                      <td className="text-right whitespace-nowrap text-[10px] tabular-nums leading-tight">
                        <div className="text-orange-600">{r.desconto > 0 ? `-${formatCurrency(r.desconto)}` : '-'}</div>
                        <div className="text-emerald-600">{r.gorjeta > 0 ? `+${formatCurrency(r.gorjeta)}` : '-'}</div>
                      </td>
                      <td className="text-right whitespace-nowrap font-medium tabular-nums">{formatCurrency(r.valor_total)}</td>
                      <td className="text-right whitespace-nowrap text-emerald-700 tabular-nums">{formatCurrency(r.valor_recebido)}</td>
                      <td className="text-right whitespace-nowrap text-violet-700 tabular-nums">{formatCurrency(r.comissao_barbeiro)}</td>
                      <td>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                          r.status_pagamento === 'Pago (Recebido)' ? 'bg-green-100 text-green-700' :
                          r.status_pagamento === 'Cortesia (Pago)' ? 'bg-purple-100 text-purple-700' :
                          r.status_pagamento === 'Aguardando Pagamento' ? 'bg-yellow-100 text-yellow-700' :
                          r.status_pagamento === 'Cancelado' ? 'bg-red-100 text-red-700' :
                          r.status_pagamento === 'Concluído sem Cobrança' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}
                        title="Refere-se ao pagamento do cliente (Contas a Receber). Não representa pagamento de comissão ao barbeiro.">
                          {r.status_pagamento === 'Pago (Recebido)' ? 'Pago' :
                           r.status_pagamento === 'Cortesia (Pago)' ? 'Cortesia' :
                           r.status_pagamento === 'Aguardando Pagamento' ? 'Aguardando' :
                           r.status_pagamento === 'Concluído sem Cobrança' ? 'S/ Cobrança' :
                           r.status_pagamento}
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

      {filtered.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Total Serviços</p>
                <p className="font-semibold">{formatCurrency(filtered.reduce((s, r) => s + r.valor_servico, 0))}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Descontos</p>
                <p className="font-semibold text-orange-600">{formatCurrency(filtered.reduce((s, r) => s + r.desconto, 0))}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Gorjetas</p>
                <p className="font-semibold text-emerald-600">{formatCurrency(filtered.reduce((s, r) => s + r.gorjeta, 0))}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Geral</p>
                <p className="font-semibold">{formatCurrency(filtered.reduce((s, r) => s + r.valor_total, 0))}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Recebido</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(filtered.reduce((s, r) => s + r.valor_recebido, 0))}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Comissões</p>
                <p className="font-semibold text-violet-700">{formatCurrency(filtered.reduce((s, r) => s + r.comissao_barbeiro, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelatorioAnalitico;
