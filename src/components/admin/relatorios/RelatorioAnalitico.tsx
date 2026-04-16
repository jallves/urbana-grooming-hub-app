import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPaymentMethodLabel } from '@/utils/categoryMappings';
import { Input } from '@/components/ui/input';

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
              .select('id, valor_total, desconto, gorjeta, forma_pagamento, status, created_at, updated_at')
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
        // Sessões de totem para identificar origem do checkout
        agendamentoIds.length > 0
          ? supabase
              .from('appointment_totem_sessions')
              .select('appointment_id, status, totem_session_id')
              .in('appointment_id', agendamentoIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const vendas = vendasRes.data || [];
      const vendasItens = vendasItensRes.data || [];
      const commissions = commissionsRes.data || [];
      const comissoesLegacy = comissoesRes.data || [];
      const contasReceber = contasReceberRes.data || [];
      const totemSessions = totemSessionsRes.data || [];

      // Set de agendamentos que passaram pelo totem
      const totemAppointments = new Set(totemSessions.map((t: any) => t.appointment_id));

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

        // Check-in
        const hasCheckin =
          ag.status_totem === 'CHEGOU' ||
          ag.status_totem === 'FINALIZADO' ||
          ag.status === 'confirmado' ||
          ag.status === 'concluido';
        const dataCheckin = hasCheckin ? (ag.updated_at || ag.created_at) : null;

        // Checkout
        const dataCheckout = venda ? (venda.updated_at || venda.created_at) : null;

        // Pagamento
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
          : venda && venda.status === 'pago'
          ? valorTotal
          : 0;

        // Comissão (tenta por appointment_id, depois por venda_id)
        const comissaoValor =
          comissaoByAppointment.get(ag.id) ||
          (ag.venda_id ? comissaoByVenda.get(ag.venda_id) || 0 : 0);

        // Status do pagamento - mais didático
        let statusPagamento: string;
        if (ag.status === 'cancelado') {
          statusPagamento = 'Cancelado';
        } else if (venda) {
          statusPagamento = venda.status === 'pago' ? 'Pago (Recebido)' : 'Aguardando Pagamento';
        } else if (ag.status === 'concluido') {
          statusPagamento = 'Concluído sem Cobrança';
        } else {
          statusPagamento = 'Sem Checkout';
        }

        // Origem do checkout: Totem ou Admin (manual)
        let origemCheckout = '-';
        if (venda) {
          origemCheckout = totemAppointments.has(ag.id) ? 'Totem' : 'Admin (Manual)';
        }

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
          forma_pagamento: formaPagamento,
          valor_servico: valorServico,
          desconto,
          gorjeta,
          valor_total: valorTotal,
          valor_recebido: valorRecebido,
          comissao_barbeiro: comissaoValor,
          status_pagamento: statusPagamento,
        };
      });

      return result;
    },
  });

  const filtered = rows.filter(r =>
    !searchTerm ||
    r.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.barbeiro_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.servico_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, barbeiro ou serviço..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>
          {/* Legenda explicativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-[11px] text-gray-700 space-y-1">
            <p className="font-semibold text-blue-800 mb-1">📖 Legenda do Relatório:</p>
            <p><strong>Status Pgto:</strong> Refere-se ao <em>pagamento do cliente</em> (Contas a Receber), <strong>não</strong> ao pagamento de comissão do barbeiro.</p>
            <p>• <span className="text-green-700 font-medium">Pago (Recebido)</span> = cliente pagou e o valor entrou no caixa.</p>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Data</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Hora</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Barbeiro</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Serviço</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Extras</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Status Agend.</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Data Check-in</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Data Checkout</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Origem Checkout</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Forma Pgto</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Valor Serv.</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Desconto</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Gorjeta</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right" title="Valor recebido do cliente">Recebido (Cliente)</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right" title="Comissão devida ao barbeiro">Comissão Barbeiro</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap" title="Status do pagamento do cliente (não da comissão)">Status Pgto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8 text-gray-500">
                      Nenhum agendamento encontrado para o período selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => (
                    <TableRow key={r.agendamento_id} className="hover:bg-gray-50 text-xs">
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(r.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{r.hora}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px] truncate" title={r.cliente_nome}>{r.cliente_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[100px] truncate" title={r.barbeiro_nome}>{r.barbeiro_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px] truncate" title={r.servico_nome}>{r.servico_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px] truncate text-gray-500" title={r.servicos_extras}>{r.servicos_extras || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.status_agendamento === 'Concluído' ? 'bg-green-100 text-green-700' :
                          r.status_agendamento === 'Cancelado' ? 'bg-red-100 text-red-700' :
                          r.status_agendamento === 'Confirmado' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status_agendamento}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[11px]">{formatDate(r.data_checkin)}</TableCell>
                      <TableCell className="whitespace-nowrap text-[11px]">{formatDate(r.data_checkout)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.origem_checkout === 'Totem' ? 'bg-teal-100 text-teal-700' :
                          r.origem_checkout === 'Admin (Manual)' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {r.origem_checkout}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[11px]">
                        {normalizePaymentMethod(r.forma_pagamento)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.valor_servico)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-orange-600">
                        {r.desconto > 0 ? formatCurrency(r.desconto) : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-600">
                        {r.gorjeta > 0 ? formatCurrency(r.gorjeta) : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">{formatCurrency(r.valor_total)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-700">{formatCurrency(r.valor_recebido)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-violet-700">{formatCurrency(r.comissao_barbeiro)}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                          r.status_pagamento === 'Pago (Recebido)' ? 'bg-green-100 text-green-700' :
                          r.status_pagamento === 'Aguardando Pagamento' ? 'bg-yellow-100 text-yellow-700' :
                          r.status_pagamento === 'Cancelado' ? 'bg-red-100 text-red-700' :
                          r.status_pagamento === 'Concluído sem Cobrança' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}
                        title="Refere-se ao pagamento do cliente (Contas a Receber). Não representa pagamento de comissão ao barbeiro.">
                          {r.status_pagamento}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
