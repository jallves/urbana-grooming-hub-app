import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scissors, TrendingUp, Award } from 'lucide-react';

interface Props { filters: { mes: number; ano: number } }

const RelatorioServicos: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-servicos', filters],
    queryFn: async () => {
      const [servicos, agendamentos] = await Promise.all([
        supabase.from('painel_servicos').select('id, nome, preco').eq('ativo', true),
        supabase.from('painel_agendamentos').select('servico_id, servicos_extras, status').gte('data', startDate).lte('data', endDate).eq('status', 'concluido'),
      ]);

      const serviceMap: Record<string, { nome: string; preco: number; count: number; receita: number }> = {};
      servicos.data?.forEach(s => {
        serviceMap[s.id] = { nome: s.nome, preco: Number(s.preco), count: 0, receita: 0 };
      });

      agendamentos.data?.forEach(a => {
        if (a.servico_id && serviceMap[a.servico_id]) {
          serviceMap[a.servico_id].count += 1;
          serviceMap[a.servico_id].receita += serviceMap[a.servico_id].preco;
        }
        if (a.servicos_extras && Array.isArray(a.servicos_extras)) {
          (a.servicos_extras as any[]).forEach((extra: any) => {
            if (extra.id && serviceMap[extra.id]) {
              serviceMap[extra.id].count += 1;
              serviceMap[extra.id].receita += Number(extra.preco || serviceMap[extra.id].preco);
            }
          });
        }
      });

      return Object.entries(serviceMap)
        .filter(([, v]) => v.count > 0)
        .sort((a, b) => b[1].count - a[1].count);
    }
  });

  if (isLoading) return <Loading />;

  const totalVendas = data?.reduce((s, [, v]) => s + v.count, 0) || 0;
  const totalReceita = data?.reduce((s, [, v]) => s + v.receita, 0) || 0;

  const RANK_COLORS = ['bg-violet-100 border-violet-300', 'bg-violet-50 border-violet-200', 'bg-gray-50 border-gray-200'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-4 w-4 text-violet-600" />
              <p className="text-xs text-violet-600 font-medium">Serviços Vendidos</p>
            </div>
            <p className="text-xl font-bold text-violet-800">{totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-600 font-medium">Receita de Serviços</p>
            </div>
            <p className="text-xl font-bold text-emerald-800">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-violet-200">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-violet-600" />
            Ranking de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="space-y-2">
            {data?.map(([id, s], i) => {
              const pct = totalVendas > 0 ? (s.count / totalVendas) * 100 : 0;
              const pctReceita = totalReceita > 0 ? (s.receita / totalReceita) * 100 : 0;
              const colorClass = RANK_COLORS[Math.min(i, 2)];
              return (
                <div key={id} className={`p-2.5 rounded-lg border ${colorClass}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-violet-600 text-white' : i === 1 ? 'bg-violet-400 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.nome}</p>
                        <p className="text-[10px] text-gray-500">R$ {s.preco.toFixed(2)} / unidade</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-violet-800">{s.count}x <span className="text-[10px] text-violet-500">({pct.toFixed(1)}%)</span></p>
                      <p className="text-xs text-emerald-600 font-medium">R$ {s.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400">({pctReceita.toFixed(1)}%)</span></p>
                    </div>
                  </div>
                  <div className="w-full bg-violet-200/50 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!data || data.length === 0) && <p className="text-sm text-gray-400 text-center py-4">Nenhum serviço vendido no período</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-400" /></div>; }

export default RelatorioServicos;
