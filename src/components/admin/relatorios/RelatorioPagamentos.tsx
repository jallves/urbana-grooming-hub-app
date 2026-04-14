import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, TrendingUp, Clock } from 'lucide-react';

interface Props { filters: { mes: number; ano: number } }

const METHOD_COLORS: Record<string, string> = {
  'PIX': 'from-teal-500 to-emerald-500',
  'Crédito': 'from-blue-500 to-indigo-500',
  'Débito': 'from-cyan-500 to-blue-400',
  'Dinheiro': 'from-green-600 to-green-500',
  'Não informado': 'from-gray-400 to-gray-500',
};

const RelatorioPagamentos: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-pagamentos', filters],
    queryFn: async () => {
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('valor, status, forma_pagamento, descricao, data_vencimento, categoria')
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate);

      const paid = receber?.filter(r => r.status === 'recebido' || r.status === 'pago') || [];
      const pending = receber?.filter(r => r.status === 'pendente') || [];

      const byMethod: Record<string, { total: number; count: number }> = {};
      paid.forEach(r => {
        const m = normalize(r.forma_pagamento);
        if (!byMethod[m]) byMethod[m] = { total: 0, count: 0 };
        byMethod[m].total += Number(r.valor);
        byMethod[m].count += 1;
      });

      const totalPago = paid.reduce((s, r) => s + Number(r.valor), 0);
      const totalPendente = pending.reduce((s, r) => s + Number(r.valor), 0);

      return { byMethod, totalPago, totalPendente };
    }
  });

  if (isLoading) return <Loading />;

  const sorted = Object.entries(data?.byMethod || {}).sort((a, b) => b[1].total - a[1].total);
  const total = data?.totalPago || 0;
  const totalTx = sorted.reduce((s, [, v]) => s + v.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-600 font-medium">Total Recebido</p>
            </div>
            <p className="text-xl font-bold text-emerald-800">R$ {(data?.totalPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-600 font-medium">Pendente</p>
            </div>
            <p className="text-xl font-bold text-amber-700">R$ {(data?.totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-emerald-200">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Detalhamento por Método
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          {sorted.map(([method, info]) => {
            const pctVal = total > 0 ? (info.total / total) * 100 : 0;
            const pctTx = totalTx > 0 ? (info.count / totalTx) * 100 : 0;
            const gradient = METHOD_COLORS[method] || 'from-gray-400 to-gray-500';
            return (
              <div key={method}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800">{method}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">R$ {info.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-emerald-600 ml-1.5">({pctVal.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>{info.count} transação(ões)</span>
                  <span>{pctTx.toFixed(1)}% das transações</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-gradient-to-r ${gradient} h-2 rounded-full transition-all`} style={{ width: `${pctVal}%` }} />
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma receita no período</p>}
        </CardContent>
      </Card>
    </div>
  );
};

function normalize(m?: string | null): string {
  if (!m) return 'Não informado';
  const l = m.toLowerCase().trim();
  if (l.includes('pix')) return 'PIX';
  if (l.includes('credito') || l.includes('crédito') || l === 'credit_card') return 'Crédito';
  if (l.includes('debito') || l.includes('débito') || l === 'debit_card') return 'Débito';
  if (l.includes('dinheiro') || l === 'cash') return 'Dinheiro';
  return m;
}
function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400" /></div>; }

export default RelatorioPagamentos;
