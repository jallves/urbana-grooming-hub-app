import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        // Main service
        if (a.servico_id && serviceMap[a.servico_id]) {
          serviceMap[a.servico_id].count += 1;
          serviceMap[a.servico_id].receita += serviceMap[a.servico_id].preco;
        }
        // Extra services
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total de Serviços Vendidos</p>
            <p className="text-xl font-bold text-blue-700">{totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Receita de Serviços</p>
            <p className="text-xl font-bold text-emerald-700">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm">Ranking de Serviços</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="space-y-2">
            {data?.map(([id, s], i) => (
              <div key={id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.nome}</p>
                    <p className="text-xs text-gray-500">R$ {s.preco.toFixed(2)} cada</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{s.count}x</p>
                  <p className="text-xs text-emerald-600">R$ {s.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-gray-400 text-center py-4">Nenhum serviço vendido no período</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" /></div>; }

export default RelatorioServicos;
