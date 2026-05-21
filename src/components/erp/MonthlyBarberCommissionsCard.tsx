import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Scissors, CreditCard, Heart, Package, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface BarberRow {
  id: string;
  nome: string;
  receitaServicos: number; // base de cálculo (apenas serviços com valor real)
  comissaoServicos: number; // 40% (ou taxa) sobre receita
  comissaoPlanos: number;
  comissaoGorjetas: number;
  comissaoProdutos: number;
  total: number;
}

const MonthlyBarberCommissionsCard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-barber-commissions', format(selectedMonth, 'yyyy-MM')],
    queryFn: async (): Promise<BarberRow[]> => {
      // Barbeiros ativos
      const { data: barbeiros } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, commission_rate')
        .eq('ativo', true)
        .order('nome');

      if (!barbeiros || barbeiros.length === 0) return [];

      // Comissões do mês
      const { data: comissoes } = await supabase
        .from('barber_commissions')
        .select('barber_id, tipo, valor, commission_rate')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const map: Record<string, BarberRow> = {};
      barbeiros.forEach((b) => {
        map[b.id] = {
          id: b.id,
          nome: b.nome,
          receitaServicos: 0,
          comissaoServicos: 0,
          comissaoPlanos: 0,
          comissaoGorjetas: 0,
          comissaoProdutos: 0,
          total: 0,
        };
      });

      comissoes?.forEach((c: any) => {
        const row = map[c.barber_id];
        if (!row) return;
        const valor = Number(c.valor) || 0;
        const rate = Number(c.commission_rate) || 0;
        const tipo = c.tipo || 'servico';

        if (tipo === 'servico' || tipo === 'servico_extra') {
          row.comissaoServicos += valor;
          // Receita bruta implícita (apenas serviços com pagamento real)
          row.receitaServicos += rate > 0 ? valor / (rate / 100) : 0;
        } else if (tipo === 'uso_credito_assinatura') {
          row.comissaoPlanos += valor;
        } else if (tipo === 'gorjeta') {
          row.comissaoGorjetas += valor;
        } else if (tipo === 'produto') {
          row.comissaoProdutos += valor;
        }
      });

      Object.values(map).forEach((r) => {
        r.total = r.comissaoServicos + r.comissaoPlanos + r.comissaoGorjetas + r.comissaoProdutos;
      });

      return Object.values(map).sort((a, b) => b.total - a.total);
    },
    refetchInterval: 30000,
  });

  const totals = useMemo(() => {
    const rows = data || [];
    return {
      receita: rows.reduce((s, r) => s + r.receitaServicos, 0),
      servicos: rows.reduce((s, r) => s + r.comissaoServicos, 0),
      planos: rows.reduce((s, r) => s + r.comissaoPlanos, 0),
      gorjetas: rows.reduce((s, r) => s + r.comissaoGorjetas, 0),
      produtos: rows.reduce((s, r) => s + r.comissaoProdutos, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    };
  }, [data]);

  const handlePrev = () => setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNext = () => setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const handleCurrent = () => setSelectedMonth(new Date());

  const now = new Date();
  const isCurrent =
    selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();

  return (
    <Card className="bg-white border-gray-300 shadow-sm">
      <CardHeader className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Comissões por Barbeiro — Visão Mensal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 capitalize min-w-[130px] sm:min-w-[160px] text-center">
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrent && (
              <Button variant="outline" size="sm" onClick={handleCurrent} className="h-8 text-xs">
                Mês Atual
              </Button>
            )}
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2">
          A <strong>Receita Real (Serviços)</strong> considera apenas serviços com pagamento em caixa
          (Dinheiro/PIX/Débito/Crédito). Cortesia, uso de crédito de plano e produtos <strong>NÃO</strong> entram.
          A coluna <strong>Comissão Serviços (40%)</strong> é calculada sobre essa receita.
          Planos, gorjetas e produtos aparecem em colunas separadas.
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-b-2 border-purple-600 rounded-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">Nenhum barbeiro ativo cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {/* Resumo geral do mês */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <SummaryTile
                label="Receita Real (Serviços)"
                value={totals.receita}
                icon={<DollarSign className="h-3.5 w-3.5" />}
                color="bg-amber-50 text-amber-800 border-amber-200"
              />
              <SummaryTile
                label="Comissão Serviços (40%)"
                value={totals.servicos}
                icon={<Scissors className="h-3.5 w-3.5" />}
                color="bg-blue-50 text-blue-800 border-blue-200"
              />
              <SummaryTile
                label="Planos"
                value={totals.planos}
                icon={<CreditCard className="h-3.5 w-3.5" />}
                color="bg-emerald-50 text-emerald-800 border-emerald-200"
              />
              <SummaryTile
                label="Gorjetas"
                value={totals.gorjetas}
                icon={<Heart className="h-3.5 w-3.5" />}
                color="bg-pink-50 text-pink-800 border-pink-200"
              />
              <SummaryTile
                label="Produtos"
                value={totals.produtos}
                icon={<Package className="h-3.5 w-3.5" />}
                color="bg-purple-50 text-purple-800 border-purple-200"
              />
              <SummaryTile
                label="Total a Pagar"
                value={totals.total}
                icon={<Users className="h-3.5 w-3.5" />}
                color="bg-slate-100 text-slate-900 border-slate-300 font-bold"
              />
            </div>

            {/* Tabela por barbeiro */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left p-2 font-semibold">Barbeiro</th>
                    <th className="text-right p-2 font-semibold whitespace-nowrap">Receita Real (Serviços)</th>
                    <th className="text-right p-2 font-semibold whitespace-nowrap">Comissão Serviços (40%)</th>
                    <th className="text-right p-2 font-semibold">Planos</th>
                    <th className="text-right p-2 font-semibold">Gorjetas</th>
                    <th className="text-right p-2 font-semibold">Produtos</th>
                    <th className="text-right p-2 font-semibold bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-800">{r.nome}</td>
                      <td className="p-2 text-right text-amber-800">{fmt(r.receitaServicos)}</td>
                      <td className="p-2 text-right text-blue-800 font-semibold">{fmt(r.comissaoServicos)}</td>
                      <td className="p-2 text-right text-emerald-800">{fmt(r.comissaoPlanos)}</td>
                      <td className="p-2 text-right text-pink-800">{fmt(r.comissaoGorjetas)}</td>
                      <td className="p-2 text-right text-purple-800">{fmt(r.comissaoProdutos)}</td>
                      <td className="p-2 text-right font-bold text-slate-900 bg-slate-50">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                    <td className="p-2 text-gray-900">TOTAL GERAL</td>
                    <td className="p-2 text-right text-amber-800">{fmt(totals.receita)}</td>
                    <td className="p-2 text-right text-blue-800">{fmt(totals.servicos)}</td>
                    <td className="p-2 text-right text-emerald-800">{fmt(totals.planos)}</td>
                    <td className="p-2 text-right text-pink-800">{fmt(totals.gorjetas)}</td>
                    <td className="p-2 text-right text-purple-800">{fmt(totals.produtos)}</td>
                    <td className="p-2 text-right text-slate-900 bg-slate-200">{fmt(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SummaryTile: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label,
  value,
  icon,
  color,
}) => (
  <div className={`rounded-lg border p-2 ${color}`}>
    <div className="flex items-center gap-1.5 mb-0.5">
      {icon}
      <span className="text-[10px] sm:text-[11px] font-medium leading-tight">{label}</span>
    </div>
    <p className="text-sm sm:text-base font-bold leading-tight">{fmt(value)}</p>
  </div>
);

export default MonthlyBarberCommissionsCard;