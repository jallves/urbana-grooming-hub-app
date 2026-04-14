import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Award, CreditCard } from 'lucide-react';

interface Props { filters: { mes: number; ano: number } }

const RelatorioResumo: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-resumo', filters],
    queryFn: async () => {
      const [receber, pagar, vendas, agendamentos, cafes] = await Promise.all([
        supabase.from('contas_receber').select('valor, status, categoria, forma_pagamento').gte('data_vencimento', startDate).lte('data_vencimento', endDate),
        supabase.from('contas_pagar').select('valor, status, categoria').gte('data_vencimento', startDate).lte('data_vencimento', endDate),
        supabase.from('vendas').select('valor_total, status, created_at').gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`),
        supabase.from('painel_agendamentos').select('id, status').gte('data', startDate).lte('data', endDate),
        supabase.from('coffee_records').select('quantity').gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`),
      ]);

      const receitaTotal = receber.data?.filter(r => r.status === 'recebido' || r.status === 'pago').reduce((s, r) => s + Number(r.valor), 0) || 0;
      const despesaTotal = pagar.data?.filter(d => d.status === 'pago').reduce((s, d) => s + Number(d.valor), 0) || 0;
      const comissoes = pagar.data?.filter(d => d.categoria === 'comissao').reduce((s, d) => s + Number(d.valor), 0) || 0;
      const totalVendas = vendas.data?.filter(v => v.status === 'pago').length || 0;
      const totalAgendamentos = agendamentos.data?.filter(a => a.status === 'concluido').length || 0;
      const totalCafes = cafes.data?.reduce((s, c) => s + (c.quantity || 1), 0) || 0;
      const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;
      const lucro = receitaTotal - despesaTotal;
      const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;

      const pagamentos: Record<string, number> = {};
      receber.data?.filter(r => r.status === 'recebido' || r.status === 'pago').forEach(r => {
        const method = normalizePaymentMethod(r.forma_pagamento);
        pagamentos[method] = (pagamentos[method] || 0) + Number(r.valor);
      });

      return { receitaTotal, despesaTotal, comissoes, totalVendas, totalAgendamentos, totalCafes, ticketMedio, pagamentos, lucro, margem };
    }
  });

  if (isLoading) return <LoadingSkeleton />;

  const cards = [
    { title: 'Receita Total', value: fmt(data?.receitaTotal), icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { title: 'Despesas Totais', value: fmt(data?.despesaTotal), icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    { title: 'Lucro Líquido', value: fmt(data?.lucro), icon: DollarSign, color: (data?.lucro || 0) >= 0 ? 'text-emerald-700' : 'text-red-700', bg: (data?.lucro || 0) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200', extra: `Margem: ${(data?.margem || 0).toFixed(1)}%` },
    { title: 'Comissões', value: fmt(data?.comissoes), icon: Users, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', extra: data?.receitaTotal ? `${((data.comissoes / data.receitaTotal) * 100).toFixed(1)}% da receita` : '' },
    { title: 'Atendimentos', value: String(data?.totalAgendamentos || 0), icon: Award, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { title: 'Ticket Médio', value: fmt(data?.ticketMedio), icon: ShoppingBag, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  ];

  const totalPagamentos = Object.values(data?.pagamentos || {}).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className={`border ${c.bg}`}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                <span className={c.color}>{c.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className={`text-lg sm:text-xl font-bold ${c.color}`}>{c.value}</p>
              {(c as any).extra && <p className="text-[10px] text-gray-500 mt-0.5">{(c as any).extra}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods with percentages */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-600" />
            Receita por Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="space-y-2">
            {Object.entries(data?.pagamentos || {}).sort((a, b) => b[1] - a[1]).map(([method, value]) => {
              const pct = totalPagamentos > 0 ? (value / totalPagamentos) * 100 : 0;
              return (
                <div key={method} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-gray-700">{method}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{fmt(value)}</span>
                    <span className="text-xs text-slate-500 ml-1.5">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(data?.pagamentos || {}).length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum dado no período</p>}
          </div>
        </CardContent>
      </Card>

      {/* Coffee */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm text-amber-700">☕ Cafés Consumidos</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-3xl font-bold text-amber-800">{data?.totalCafes || 0}</p>
          <p className="text-xs text-amber-600 mt-1">cafés servidos no mês</p>
        </CardContent>
      </Card>
    </div>
  );
};

function fmt(v?: number) { return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }
function normalizePaymentMethod(m?: string | null): string {
  if (!m) return 'Não informado';
  const lower = m.toLowerCase().trim();
  if (lower.includes('pix')) return 'PIX';
  if (lower.includes('credito') || lower.includes('crédito') || lower === 'credit_card') return 'Crédito';
  if (lower.includes('debito') || lower.includes('débito') || lower === 'debit_card') return 'Débito';
  if (lower.includes('dinheiro') || lower === 'cash') return 'Dinheiro';
  return m;
}
function LoadingSkeleton() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400" /></div>; }

export default RelatorioResumo;
