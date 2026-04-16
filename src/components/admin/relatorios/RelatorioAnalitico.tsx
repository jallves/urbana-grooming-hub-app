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

const RelatorioAnalitico: React.FC<Props> = ({ filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['relatorio-analitico', filters],
    queryFn: async () => {
      // Fetch all data in parallel
      const [agendamentosRes, vendasRes, contasReceberRes, comissoesRes] = await Promise.all([
        supabase
          .from('painel_agendamentos')
          .select('id, data, hora, status, status_totem, updated_at, created_at, cliente_id, barbeiro_id, servico_id, venda_id, servicos_extras, painel_clientes, painel_barbeiros, painel_servicos')
          .gte('data', startDate)
          .lte('data', endDate)
          .order('data', { ascending: true })
          .order('hora', { ascending: true }),
        supabase
          .from('vendas')
          .select('id, valor_total, desconto, gorjeta, forma_pagamento, status, created_at, cliente_id, barbeiro_id')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`),
        supabase
          .from('contas_receber')
          .select('id, valor, status, forma_pagamento, data_recebimento, descricao, created_at')
          .gte('data_vencimento', startDate)
          .lte('data_vencimento', endDate),
        supabase
          .from('barber_commissions')
          .select('id, barber_id, valor, status, venda_id, tipo, created_at')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`),
      ]);

      const agendamentos = agendamentosRes.data || [];
      const vendas = vendasRes.data || [];
      const contasReceber = contasReceberRes.data || [];
      const comissoes = comissoesRes.data || [];

      // Build lookup maps
      const vendasMap = new Map(vendas.map(v => [v.id, v]));
      const comissoesByVenda = new Map<string, number>();
      comissoes.forEach(c => {
        const key = c.venda_id || '';
        comissoesByVenda.set(key, (comissoesByVenda.get(key) || 0) + Number(c.valor));
      });

      // Build analytical rows
      const result: AnalyticalRow[] = agendamentos.map(ag => {
        const clienteData = ag.painel_clientes as any;
        const barbeiroData = ag.painel_barbeiros as any;
        const servicoData = ag.painel_servicos as any;

        const clienteNome = clienteData?.nome || 'N/A';
        const barbeiroNome = barbeiroData?.nome || 'N/A';
        const servicoNome = servicoData?.nome || 'N/A';

        // Extras
        let extrasStr = '';
        if (ag.servicos_extras && Array.isArray(ag.servicos_extras)) {
          extrasStr = (ag.servicos_extras as any[]).map((e: any) => e.nome || e.name || '').filter(Boolean).join(', ');
        }

        // Check-in: when status_totem became 'CHEGOU'
        const hasCheckin = ag.status_totem === 'CHEGOU' || ag.status === 'confirmado' || ag.status === 'concluido';

        // Venda linked
        const venda = ag.venda_id ? vendasMap.get(ag.venda_id) : null;

        const dataCheckin = hasCheckin ? (ag.updated_at || ag.created_at) : null;
        const dataCheckout = venda ? venda.created_at : null;
        const formaPagamento = venda ? (venda.forma_pagamento || '') : '';
        const valorServico = servicoData?.preco || 0;
        const desconto = venda ? Number(venda.desconto || 0) : 0;
        const gorjeta = venda ? Number(venda.gorjeta || 0) : 0;
        const valorTotal = venda ? Number(venda.valor_total || 0) : valorServico;

        // Contas a receber matching
        const contaReceber = contasReceber.find(cr =>
          cr.descricao?.includes(ag.id) ||
          (venda && cr.descricao?.includes(venda.id))
        );
        const valorRecebido = contaReceber ? Number(contaReceber.valor) : (venda && venda.status === 'pago' ? valorTotal : 0);

        // Comissão
        const comissaoValor = ag.venda_id ? (comissoesByVenda.get(ag.venda_id) || 0) : 0;

        const statusPagamento = venda
          ? venda.status === 'pago' ? 'Pago' : 'Pendente'
          : ag.status === 'concluido' ? 'Pendente' : '-';

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
      'Status': r.status_agendamento,
      'Check-in': r.data_checkin ? formatDate(r.data_checkin) : '-',
      'Checkout': r.data_checkout ? formatDate(r.data_checkout) : '-',
      'Pagamento': getPaymentMethodLabel(r.forma_pagamento) || '-',
      'Valor Serviço': r.valor_servico,
      'Desconto': r.desconto,
      'Gorjeta': r.gorjeta,
      'Valor Total': r.valor_total,
      'Valor Recebido': r.valor_recebido,
      'Comissão Barbeiro': r.comissao_barbeiro,
      'Status Pgto': r.status_pagamento,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Auto column widths
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
      'Data', 'Hora', 'Cliente', 'Barbeiro', 'Serviço', 'Status',
      'Check-in', 'Checkout', 'Pagamento', 'Valor', 'Desc.', 'Total',
      'Recebido', 'Comissão', 'Pgto',
    ];

    const body = filtered.map(r => [
      format(new Date(r.data_agendamento), 'dd/MM', { locale: ptBR }),
      r.hora,
      r.cliente_nome.length > 15 ? r.cliente_nome.slice(0, 15) + '…' : r.cliente_nome,
      r.barbeiro_nome.length > 12 ? r.barbeiro_nome.slice(0, 12) + '…' : r.barbeiro_nome,
      r.servico_nome.length > 15 ? r.servico_nome.slice(0, 15) + '…' : r.servico_nome,
      r.status_agendamento.slice(0, 10),
      r.data_checkin ? format(new Date(r.data_checkin), 'dd/MM HH:mm') : '-',
      r.data_checkout ? format(new Date(r.data_checkout), 'dd/MM HH:mm') : '-',
      getPaymentMethodLabel(r.forma_pagamento)?.slice(0, 8) || '-',
      formatCurrency(r.valor_servico),
      formatCurrency(r.desconto),
      formatCurrency(r.valor_total),
      formatCurrency(r.valor_recebido),
      formatCurrency(r.comissao_barbeiro),
      r.status_pagamento.slice(0, 8),
    ]);

    (doc as any).autoTable({
      head: [headers],
      body,
      startY: 32,
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [55, 65, 81], fontSize: 6 },
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
      {/* Header with actions */}
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
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, barbeiro ou serviço..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Check-in</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Checkout</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Pagamento</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Valor Serv.</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Desconto</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Gorjeta</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Recebido</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Comissão</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Pgto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8 text-gray-500">
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
                      <TableCell className="whitespace-nowrap max-w-[120px] truncate">{r.cliente_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[100px] truncate">{r.barbeiro_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px] truncate">{r.servico_nome}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[100px] truncate text-gray-500">{r.servicos_extras || '-'}</TableCell>
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
                        {getPaymentMethodLabel(r.forma_pagamento) || '-'}
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
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.status_pagamento === 'Pago' ? 'bg-green-100 text-green-700' :
                          r.status_pagamento === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
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

      {/* Totals */}
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
