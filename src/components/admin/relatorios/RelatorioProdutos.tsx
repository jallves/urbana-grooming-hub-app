import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingBag, TrendingUp, AlertTriangle, XCircle, Award, Package,
  DollarSign, Search, Download, Calendar, User, CreditCard, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props { filters: { mes: number; ano: number } }

interface VendaProduto {
  venda_id: string;
  created_at: string;
  produto_id: string | null;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  forma_pagamento: string | null;
  status: string;
  cliente_id: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  barbeiro_id: string | null;
  barbeiro_nome: string;
  origem: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', pix: 'PIX',
  CREDITO: 'Crédito', credit: 'Crédito', credito: 'Crédito',
  DEBITO: 'Débito', debit: 'Débito', debito: 'Débito',
  DINHEIRO: 'Dinheiro', cash: 'Dinheiro', dinheiro: 'Dinheiro',
  CORTESIA: 'Cortesia',
};

const PAYMENT_COLORS: Record<string, string> = {
  PIX: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CREDITO: 'bg-blue-100 text-blue-700 border-blue-200',
  DEBITO: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  DINHEIRO: 'bg-amber-100 text-amber-700 border-amber-200',
  CORTESIA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const normalizePay = (p: string | null) => {
  if (!p) return 'OUTRO';
  const u = p.toUpperCase();
  if (u.includes('PIX')) return 'PIX';
  if (u.includes('CRED')) return 'CREDITO';
  if (u.includes('DEB')) return 'DEBITO';
  if (u.includes('DIN') || u.includes('CASH')) return 'DINHEIRO';
  if (u.includes('CORTES') || u.includes('CAFE') || u.includes('CAFÉ')) return 'CORTESIA';
  return u;
};

const RelatorioProdutos: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [productFilter, setProductFilter] = useState<string>('todos');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['relatorio-produtos-v2', filters],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Vendas de produtos via vendas_itens (totem checkout + venda direta)
      const { data: vendasItens } = await supabase
        .from('vendas_itens')
        .select(`
          item_id, nome, preco_unitario, quantidade, subtotal, tipo, venda_id, created_at,
          vendas!inner(id, created_at, valor_total, forma_pagamento, status, cliente_id, barbeiro_id, observacoes)
        `)
        .in('tipo', ['PRODUTO', 'produto'])
        .gte('vendas.created_at', `${startDate}T00:00:00`)
        .lte('vendas.created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      const itens = (vendasItens || []) as any[];

      // Buscar dados de clientes/barbeiros
      const clienteIds = [...new Set(itens.map(i => i.vendas?.cliente_id).filter(Boolean))];
      const barbeiroIds = [...new Set(itens.map(i => i.vendas?.barbeiro_id).filter(Boolean))];

      const [clientesRes, barbeirosRes, produtosRes] = await Promise.all([
        clienteIds.length
          ? supabase.from('painel_clientes').select('id, nome, telefone').in('id', clienteIds)
          : Promise.resolve({ data: [] as any[] }),
        barbeiroIds.length
          ? supabase.from('painel_barbeiros').select('id, nome').in('id', barbeiroIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from('painel_produtos').select('id, nome, preco, estoque, estoque_minimo, categoria, ativo')
      ]);

      const clientesMap = new Map((clientesRes.data || []).map((c: any) => [c.id, c]));
      const barbeirosMap = new Map((barbeirosRes.data || []).map((b: any) => [b.id, b]));

      const vendas: VendaProduto[] = itens.map((it) => {
        const v = it.vendas || {};
        const cli = clientesMap.get(v.cliente_id) as any;
        const barb = barbeirosMap.get(v.barbeiro_id) as any;
        const isTotem = (v.observacoes || '').toLowerCase().includes('totem');
        return {
          venda_id: v.id,
          created_at: v.created_at,
          produto_id: it.item_id,
          produto_nome: it.nome || 'Produto',
          quantidade: Number(it.quantidade || 1),
          preco_unitario: Number(it.preco_unitario || 0),
          subtotal: Number(it.subtotal || 0),
          forma_pagamento: v.forma_pagamento,
          status: v.status,
          cliente_id: v.cliente_id,
          cliente_nome: cli?.nome || 'Cliente avulso',
          cliente_telefone: cli?.telefone || null,
          barbeiro_id: v.barbeiro_id,
          barbeiro_nome: barb?.nome || '—',
          origem: isTotem ? 'Totem' : 'Painel',
        };
      });

      const produtos = produtosRes.data || [];
      const totalReceita = vendas.reduce((s, v) => s + v.subtotal, 0);
      const totalUnidades = vendas.reduce((s, v) => s + v.quantidade, 0);
      const ticketMedio = vendas.length > 0 ? totalReceita / vendas.length : 0;

      // Ranking por produto
      const byProduct: Record<string, { nome: string; vendas: number; receita: number; produto_id: string | null }> = {};
      vendas.forEach(v => {
        const key = v.produto_nome;
        if (!byProduct[key]) byProduct[key] = { nome: key, vendas: 0, receita: 0, produto_id: v.produto_id };
        byProduct[key].vendas += v.quantidade;
        byProduct[key].receita += v.subtotal;
      });

      // Por forma de pagamento
      const byPayment: Record<string, { count: number; receita: number }> = {};
      vendas.forEach(v => {
        const k = normalizePay(v.forma_pagamento);
        if (!byPayment[k]) byPayment[k] = { count: 0, receita: 0 };
        byPayment[k].count += 1;
        byPayment[k].receita += v.subtotal;
      });

      const lowStock = produtos.filter(p => p.ativo && (p.estoque || 0) > 0 && (p.estoque || 0) <= (p.estoque_minimo || 10));
      const noStock = produtos.filter(p => p.ativo && (p.estoque || 0) === 0);
      const valorEstoque = produtos.filter(p => p.ativo).reduce((s, p) => s + Number(p.preco || 0) * (p.estoque || 0), 0);

      return {
        vendas,
        totalReceita,
        totalUnidades,
        ticketMedio,
        byProduct: Object.values(byProduct).sort((a, b) => b.vendas - a.vendas),
        byPayment,
        lowStock,
        noStock,
        produtos,
        valorEstoque,
      };
    }
  });

  const filteredVendas = useMemo(() => {
    if (!data?.vendas) return [];
    return data.vendas.filter(v => {
      if (paymentFilter !== 'todos' && normalizePay(v.forma_pagamento) !== paymentFilter) return false;
      if (productFilter !== 'todos' && v.produto_nome !== productFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return v.produto_nome.toLowerCase().includes(s)
          || v.cliente_nome.toLowerCase().includes(s)
          || v.barbeiro_nome.toLowerCase().includes(s)
          || (v.cliente_telefone || '').includes(s);
      }
      return true;
    });
  }, [data?.vendas, search, paymentFilter, productFilter]);

  const exportCSV = () => {
    if (!filteredVendas.length) return;
    const headers = ['Data', 'Hora', 'Produto', 'Qtd', 'Preço Unit.', 'Subtotal', 'Cliente', 'Telefone', 'Barbeiro', 'Pagamento', 'Origem', 'Status'];
    const rows = filteredVendas.map(v => [
      format(new Date(v.created_at), 'dd/MM/yyyy'),
      format(new Date(v.created_at), 'HH:mm'),
      v.produto_nome,
      v.quantidade,
      v.preco_unitario.toFixed(2),
      v.subtotal.toFixed(2),
      v.cliente_nome,
      v.cliente_telefone || '',
      v.barbeiro_nome,
      PAYMENT_LABELS[normalizePay(v.forma_pagamento)] || v.forma_pagamento || '',
      v.origem,
      v.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-produtos-${filters.ano}-${String(filters.mes).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loading />;

  const totalUnidades = data?.totalUnidades || 0;

  return (
    <div className="space-y-4">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-[10px] text-emerald-700 font-medium uppercase">Receita</p>
            </div>
            <p className="text-lg font-bold text-emerald-800">R$ {(data?.totalReceita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-[10px] text-orange-700 font-medium uppercase">Unidades</p>
            </div>
            <p className="text-lg font-bold text-orange-800">{totalUnidades}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-[10px] text-blue-700 font-medium uppercase">Ticket Médio</p>
            </div>
            <p className="text-lg font-bold text-blue-800">R$ {(data?.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3.5 w-3.5 text-purple-600" />
              <p className="text-[10px] text-purple-700 font-medium uppercase">Valor Estoque</p>
            </div>
            <p className="text-lg font-bold text-purple-800">R$ {(data?.valorEstoque || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <p className="text-[10px] text-red-700 font-medium uppercase">Alertas Estoque</p>
            </div>
            <p className="text-lg font-bold text-red-800">{(data?.lowStock?.length || 0) + (data?.noStock?.length || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Por forma de pagamento */}
      {data && Object.keys(data.byPayment).length > 0 && (
        <Card className="bg-white border-orange-200">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" /> Vendas por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(data.byPayment).map(([pay, info]) => (
                <div key={pay} className={`p-2.5 rounded-lg border ${PAYMENT_COLORS[pay] || 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-[10px] font-semibold uppercase opacity-75">{PAYMENT_LABELS[pay] || pay}</p>
                  <p className="text-sm font-bold mt-0.5">R$ {info.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] opacity-75">{info.count} venda{info.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros + Tabela detalhada */}
      <Card className="bg-white border-orange-200">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-600" /> Histórico de Vendas ({filteredVendas.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV} disabled={!filteredVendas.length}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar produto, cliente, barbeiro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-9 text-xs"
              />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Produto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os produtos</SelectItem>
                {data?.byProduct.map(p => (
                  <SelectItem key={p.nome} value={p.nome}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas formas</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="CREDITO">Crédito</SelectItem>
                <SelectItem value="DEBITO">Débito</SelectItem>
                <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredVendas.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Nenhuma venda encontrada para os filtros aplicados.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Data/Hora</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px] text-center">Qtd</TableHead>
                  <TableHead className="text-[11px] text-right">Subtotal</TableHead>
                  <TableHead className="text-[11px]">Cliente</TableHead>
                  <TableHead className="text-[11px]">Barbeiro</TableHead>
                  <TableHead className="text-[11px]">Pagamento</TableHead>
                  <TableHead className="text-[11px]">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.map((v, i) => {
                  const pay = normalizePay(v.forma_pagamento);
                  return (
                    <TableRow key={`${v.venda_id}-${i}`}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(new Date(v.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                        <div className="text-[10px] text-gray-500 ml-4">{format(new Date(v.created_at), 'HH:mm')}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-800">{v.produto_nome}</TableCell>
                      <TableCell className="text-xs text-center font-semibold">{v.quantidade}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-emerald-700">
                        R$ {v.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{v.cliente_nome}</span>
                        </div>
                        {v.cliente_telefone && <div className="text-[10px] text-gray-500 ml-4">{v.cliente_telefone}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{v.barbeiro_nome}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`text-[10px] ${PAYMENT_COLORS[pay] || ''}`}>
                          {PAYMENT_LABELS[pay] || v.forma_pagamento || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`text-[10px] ${v.origem === 'Totem' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700'}`}>
                          {v.origem}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ranking de produtos */}
      {(data?.byProduct?.length || 0) > 0 && (
        <Card className="bg-white border-orange-200">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-600" /> Ranking de Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byProduct.map((p, i) => {
              const pct = totalUnidades > 0 ? (p.vendas / totalUnidades) * 100 : 0;
              const totalRec = data.byProduct.reduce((s, x) => s + x.receita, 0) || 1;
              const pctRec = (p.receita / totalRec) * 100;
              const estoqueAtual = data.produtos.find(prod => prod.id === p.produto_id)?.estoque ?? null;
              return (
                <div key={i} className={`p-2.5 rounded-lg border ${i === 0 ? 'bg-orange-100 border-orange-300' : i === 1 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-orange-600 text-white' : i === 1 ? 'bg-orange-400 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.nome}</p>
                        {estoqueAtual !== null && (
                          <p className="text-[10px] text-gray-500">Estoque atual: <span className={`font-semibold ${estoqueAtual === 0 ? 'text-red-600' : estoqueAtual <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{estoqueAtual} un.</span></p>
                        )}
                      </div>
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

      {/* Alertas estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(data?.lowStock?.length || 0) > 0 && (
          <Card className="bg-white border-amber-300">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Estoque Baixo ({data?.lowStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
              {data?.lowStock.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <span className="text-sm text-gray-700 font-medium">{p.nome}</span>
                    {p.categoria && <p className="text-[10px] text-gray-500">{p.categoria}</p>}
                  </div>
                  <span className="text-sm font-bold text-amber-700">{p.estoque} un.</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(data?.noStock?.length || 0) > 0 && (
          <Card className="bg-white border-red-300">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Sem Estoque ({data?.noStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
              {data?.noStock.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <span className="text-sm text-gray-700 font-medium">{p.nome}</span>
                    {p.categoria && <p className="text-[10px] text-gray-500">{p.categoria}</p>}
                  </div>
                  <span className="text-sm font-bold text-red-700">0 un.</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function Loading() {
  return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" /></div>;
}

export default RelatorioProdutos;
