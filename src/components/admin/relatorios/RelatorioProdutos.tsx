import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, TrendingUp, AlertTriangle, XCircle, Award } from 'lucide-react';

interface Props { filters: { mes: number; ano: number } }

const RelatorioProdutos: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-produtos', filters],
    queryFn: async () => {
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('valor, descricao, status, forma_pagamento')
        .eq('categoria', 'produto')
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate);

      const { data: vendasItens } = await supabase
        .from('vendas_itens')
        .select('nome, preco_unitario, quantidade, subtotal, tipo, venda_id, vendas!inner(status, created_at)')
        .eq('tipo', 'produto')
        .eq('vendas.status', 'pago')
        .gte('vendas.created_at', `${startDate}T00:00:00`)
        .lte('vendas.created_at', `${endDate}T23:59:59`);

      const { data: produtos } = await supabase
        .from('painel_produtos')
        .select('id, nome, preco, estoque, estoque_minimo')
        .eq('ativo', true);

      const produtosSales: Record<string, { nome: string; vendas: number; receita: number }> = {};
      vendasItens?.forEach((item: any) => {
        const key = item.nome || 'Produto';
        if (!produtosSales[key]) produtosSales[key] = { nome: key, vendas: 0, receita: 0 };
        produtosSales[key].vendas += item.quantidade || 1;
        produtosSales[key].receita += Number(item.subtotal || 0);
      });

      const totalReceita = receber?.filter(r => r.status === 'recebido' || r.status === 'pago').reduce((s, r) => s + Number(r.valor), 0) || 0;
      const lowStock = produtos?.filter(p => (p.estoque || 0) > 0 && (p.estoque || 0) <= (p.estoque_minimo || 10)) || [];
      const noStock = produtos?.filter(p => (p.estoque || 0) === 0) || [];

      return {
        totalReceita,
        totalVendas: Object.values(produtosSales).reduce((s, p) => s + p.vendas, 0),
        byProduct: Object.values(produtosSales).sort((a, b) => b.vendas - a.vendas),
        lowStock,
        noStock,
        allProducts: produtos || [],
      };
    }
  });

  if (isLoading) return <Loading />;

  const totalVendas = data?.totalVendas || 0;
  const RANK_COLORS = ['bg-orange-100 border-orange-300', 'bg-orange-50 border-orange-200', 'bg-gray-50 border-gray-200'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-[10px] text-emerald-600 font-medium">Receita</p>
            </div>
            <p className="text-lg font-bold text-emerald-800">R$ {(data?.totalReceita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-[10px] text-orange-600 font-medium">Vendidos</p>
            </div>
            <p className="text-lg font-bold text-orange-800">{totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <p className="text-[10px] text-amber-600 font-medium">Estoque Baixo</p>
            </div>
            <p className="text-lg font-bold text-amber-800">{data?.lowStock?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              <p className="text-[10px] text-red-600 font-medium">Sem Estoque</p>
            </div>
            <p className="text-lg font-bold text-red-800">{data?.noStock?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      {(data?.byProduct?.length || 0) > 0 && (
        <Card className="bg-white border-orange-200">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-600" />
              Ranking de Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byProduct.map((p, i) => {
              const pct = totalVendas > 0 ? (p.vendas / totalVendas) * 100 : 0;
              const totalRec = data?.byProduct.reduce((s, x) => s + x.receita, 0) || 1;
              const pctRec = (p.receita / totalRec) * 100;
              const colorClass = RANK_COLORS[Math.min(i, 2)];
              return (
                <div key={i} className={`p-2.5 rounded-lg border ${colorClass}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-orange-600 text-white' : i === 1 ? 'bg-orange-400 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-800">{p.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-800">{p.vendas}x <span className="text-[10px] text-orange-500">({pct.toFixed(1)}%)</span></p>
                      <p className="text-xs text-emerald-600 font-medium">R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400">({pctRec.toFixed(1)}%)</span></p>
                    </div>
                  </div>
                  <div className="w-full bg-orange-200/50 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {(data?.lowStock?.length || 0) > 0 && (
        <Card className="bg-white border-amber-300">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Estoque Baixo</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.lowStock.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-sm text-gray-700 font-medium">{p.nome}</span>
                <span className="text-sm font-bold text-amber-700">{p.estoque} un.</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Stock */}
      {(data?.noStock?.length || 0) > 0 && (
        <Card className="bg-white border-red-300">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm text-red-700 flex items-center gap-2"><XCircle className="h-4 w-4" /> Sem Estoque</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.noStock.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2.5 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm text-gray-700 font-medium">{p.nome}</span>
                <span className="text-sm font-bold text-red-700">0 un.</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" /></div>; }

export default RelatorioProdutos;
