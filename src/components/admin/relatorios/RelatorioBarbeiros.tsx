import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props { filters: { mes: number; ano: number } }

const RelatorioBarbeiros: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-barbeiros', filters],
    queryFn: async () => {
      const [barbeiros, comissoes, agendamentos] = await Promise.all([
        supabase.from('painel_barbeiros').select('id, nome, commission_rate, foto_url, image_url').eq('ativo', true),
        supabase.from('barber_commissions').select('barber_id, valor, status, tipo').gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`),
        supabase.from('painel_agendamentos').select('barbeiro_id, status').gte('data', startDate).lte('data', endDate).eq('status', 'concluido'),
      ]);

      const barberMap: Record<string, {
        nome: string; foto?: string; atendimentos: number; comissaoPaga: number; comissaoPendente: number;
        gorjetas: number; receitaBruta: number; rate: number;
      }> = {};

      barbeiros.data?.forEach(b => {
        barberMap[b.id] = {
          nome: b.nome,
          foto: b.foto_url || b.image_url || undefined,
          atendimentos: 0,
          comissaoPaga: 0,
          comissaoPendente: 0,
          gorjetas: 0,
          receitaBruta: 0,
          rate: Number(b.commission_rate) || 50,
        };
      });

      agendamentos.data?.forEach(a => {
        if (a.barbeiro_id && barberMap[a.barbeiro_id]) {
          barberMap[a.barbeiro_id].atendimentos += 1;
        }
      });

      comissoes.data?.forEach(c => {
        if (!c.barber_id || !barberMap[c.barber_id]) return;
        const val = Number(c.valor) || 0;
        if (c.tipo === 'gorjeta') {
          barberMap[c.barber_id].gorjetas += val;
        } else if (c.status === 'pago') {
          barberMap[c.barber_id].comissaoPaga += val;
        } else {
          barberMap[c.barber_id].comissaoPendente += val;
        }
      });

      // Calculate gross revenue from commissions
      Object.values(barberMap).forEach(b => {
        const totalComissao = b.comissaoPaga + b.comissaoPendente;
        b.receitaBruta = b.rate > 0 ? totalComissao / (b.rate / 100) : 0;
      });

      return Object.entries(barberMap)
        .filter(([, v]) => v.atendimentos > 0 || v.comissaoPaga > 0 || v.comissaoPendente > 0)
        .sort((a, b) => b[1].receitaBruta - a[1].receitaBruta);
    }
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      {data?.map(([id, b]) => (
        <Card key={id} className="bg-white border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 mb-3">
              {b.foto ? (
                <img src={b.foto} alt={b.nome} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">{b.nome[0]}</div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-sm">{b.nome}</p>
                <p className="text-xs text-gray-500">{b.atendimentos} atendimento{b.atendimentos !== 1 ? 's' : ''} • Taxa: {b.rate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Receita Bruta" value={fmt(b.receitaBruta)} color="text-emerald-700" />
              <Metric label="Comissão Paga" value={fmt(b.comissaoPaga)} color="text-blue-700" />
              <Metric label="Comissão Pendente" value={fmt(b.comissaoPendente)} color="text-amber-600" />
              <Metric label="Gorjetas" value={fmt(b.gorjetas)} color="text-pink-600" />
            </div>
          </CardContent>
        </Card>
      ))}
      {(!data || data.length === 0) && <p className="text-sm text-gray-400 text-center py-8">Nenhum dado de barbeiros no período</p>}
    </div>
  );
};

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
function fmt(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }
function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" /></div>; }

export default RelatorioBarbeiros;
