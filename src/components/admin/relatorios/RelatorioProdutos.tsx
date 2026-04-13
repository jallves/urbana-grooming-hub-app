import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props { filters: { mes: number; ano: number } }

const RelatorioProdutos: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-produtos', filters],
    queryFn: async () => {
      // Get product sales from contas_receber with categoria 'produto'
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('valor, descricao, status, forma_pagamento')
        .eq('categoria', 'produto')
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate);

      // Get product sales from vendas_itens
      const { data: vendasItens } = await supabase
        .from('vendas_itens')
        .select('nome, preco_unitario, quantidade, subtotal, tipo, venda_id, vendas!inner(status, created_at)')
        .eq('tipo', 'produto')
        .eq('vendas.status', 'pago')
        .gte('vendas.created_at', `${startDate}T00:00:00`)
        .lte('vendas.created_at', `${endDate}T23:59:59`);

      // Get current stock levels
      const { data: produtos } = await supabase
        .from('painel_produtos')
        .select('id, nome, preco, estoque, estoque_minimo')
        .eq('ativo', true);

      const produtosSales: Record<string, { nome: string; vendas: number; receita: number }> = {};

      // Parse vendas_itens for product breakdown
      vendasItens?.forEach((item: any) => {
        const key = item.nome || 'Produto';
        if (!produtosSales[key]) produtosSales[key] = { nome: key, vendas: 0, receita: 0 };
        produtosSales[key].vendas += item.quantidade || 1;
        produtosSales[key].receita += Number(item.subtotal || 0);
      });

      const totalReceita = receber?.filter(r => r.status === 'recebido' || r.status === 'pago').reduce((s, r) => s + Number(r.valor), 0) || 0;
      const lowStock = produtos?.filter(p => (p.estoque || 0) <= (p.estoque_minimo || 10)) || [];

      return {
        totalReceita,
        totalVendas: Object.values(produtosSales).reduce((s, p) => s + p.vendas, 0),
        byProduct: Object.values(produtosSales).sort((a, b) => b.receita - a.receita),
        lowStock,
        allProducts: produtos || [],
      };
    }
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Receita de Produtos</p>
            <p className="text-xl font-bold text-emerald-700">R$ {(data?.totalReceita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Itens Vendidos</p>
            <p className="text-xl font-bold text-blue-700">{data?.totalVendas || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      {(data?.byProduct?.length || 0) > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm">Ranking de Produtos</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byProduct.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <p className="text-sm font-medium text-gray-800">{p.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{p.vendas}x</p>
                  <p className="text-xs text-emerald-600">R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {(data?.lowStock?.length || 0) > 0 && (
        <Card className="bg-white border-red-200">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm text-red-700">⚠️ Estoque Baixo</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.lowStock.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700">{p.nome}</span>
                <span className="text-sm font-bold text-red-600">{p.estoque} un.</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" /></div>; }

export default RelatorioProdutos;
