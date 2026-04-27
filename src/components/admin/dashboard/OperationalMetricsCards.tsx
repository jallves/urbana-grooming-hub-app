import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Receipt, Target, Gift, TrendingUp, CheckCircle, DollarSign, HeartHandshake, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTodayInBrazil } from '@/lib/utils/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OperationalMetricsCardsProps {
  month: number;
  year: number;
}

const OperationalMetricsCards: React.FC<OperationalMetricsCardsProps> = ({ month, year }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['operational-metrics-dashboard', month, year],
    queryFn: async () => {
      const firstDayOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const lastDayOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const todayStr = getTodayInBrazil();
      const firstDayOfYear = `${year}-01-01`;
      const lastDayOfYear = `${year}-12-31`;

      const [
        clientesResult,
        vendasMesResult,
        agendamentosHojeResult,
        agendamentosFuturosResult,
        agendamentosMesResult,
        gorjetasVendasResult,
        gorjetasComissoesResult,
        receitaAnualResult,
        concluidosAnualResult,
        cortesiasVendasResult,
        servicosResult,
        cortesiasAnoResult,
      ] = await Promise.all([
        supabase.from('painel_clientes').select('id', { count: 'exact', head: true }),
        supabase
          .from('vendas')
          .select('cliente_id, valor_total, gorjeta, forma_pagamento, observacoes')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth + 'T23:59:59')
          .in('status', ['pago', 'PAGA', 'paga', 'PAGO']),
        supabase
          .from('painel_agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('data', todayStr),
        supabase
          .from('painel_agendamentos')
          .select('id', { count: 'exact', head: true })
          .gt('data', todayStr)
          .eq('status', 'agendado'),
        supabase
          .from('painel_agendamentos')
          .select('status')
          .gte('data', firstDayOfMonth)
          .lte('data', lastDayOfMonth),
        supabase
          .from('vendas')
          .select('gorjeta')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth + 'T23:59:59')
          .in('status', ['pago', 'PAGA', 'paga', 'PAGO']),
        supabase
          .from('barber_commissions')
          .select('valor')
          .eq('tipo', 'gorjeta')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth + 'T23:59:59'),
        supabase
          .from('contas_receber')
          .select('valor, status')
          .gte('data_vencimento', firstDayOfYear)
          .lte('data_vencimento', lastDayOfYear),
        supabase
          .from('painel_agendamentos')
          .select('id, servico_id, servicos_extras, painel_servicos:servico_id(preco)')
          .gte('data', firstDayOfMonth)
          .lte('data', lastDayOfMonth)
          .eq('status', 'concluido'),
        supabase
          .from('vendas')
          .select('id, valor_total, observacoes, forma_pagamento')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth + 'T23:59:59')
          .in('status', ['pago', 'PAGA', 'paga', 'PAGO']),
        supabase.from('painel_servicos').select('id, preco'),
        supabase
          .from('vendas')
          .select('id, valor_total, observacoes, forma_pagamento')
          .gte('created_at', firstDayOfYear)
          .lte('created_at', lastDayOfYear + 'T23:59:59')
          .in('status', ['pago', 'PAGA', 'paga', 'PAGO']),
      ]);

      const totalClientes = clientesResult.count || 0;
      const vendasMes = vendasMesResult.data || [];
      const clientesAtivosMes = new Set(vendasMes.map(v => v.cliente_id).filter(Boolean)).size;
      const ticketMedio = vendasMes.length > 0 
        ? vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendasMes.length 
        : 0;
      const gorjetasVendas = gorjetasVendasResult.data?.reduce((sum, v) => sum + (v.gorjeta || 0), 0) || 0;
      const gorjetasComissoes = gorjetasComissoesResult.data?.reduce((sum, v) => sum + Number(v.valor || 0), 0) || 0;
      const totalGorjetas = gorjetasVendas + gorjetasComissoes;
      const agendamentosHoje = agendamentosHojeResult.count || 0;
      const agendamentosFuturos = agendamentosFuturosResult.count || 0;
      
      const agendamentosMes = agendamentosMesResult.data || [];
      const totalAgendamentos = agendamentosMes.length;
      const concluidos = agendamentosMes.filter(a => a.status === 'concluido').length;
      const taxaConversao = totalAgendamentos > 0 ? (concluidos / totalAgendamentos) * 100 : 0;

      const concluidosData = concluidosAnualResult.data || [];
      const concluidosMes = concluidosData.length;

      const receitaAnual = (receitaAnualResult.data || [])
        .filter(r => r.status === 'recebido' || r.status === 'pago')
        .reduce((sum, r) => sum + Number(r.valor), 0);

      // ===== Cortesias (valor REAL do serviço/produto) =====
      const isCortesia = (v: { valor_total: number | null; observacoes: string | null; forma_pagamento: string | null }) => {
        const obs = (v.observacoes || '').toLowerCase();
        const fp = (v.forma_pagamento || '').toLowerCase();
        return Number(v.valor_total) === 0 || obs.includes('cortesia') || fp.includes('cortesia');
      };

      const cortesiasMes = (cortesiasVendasResult.data || []).filter(isCortesia);
      const cortesiasAno = (cortesiasAnoResult.data || []).filter(isCortesia);

      // Buscar itens reais para cortesias zeradas
      const allCortesiaIds = Array.from(
        new Set([...cortesiasMes, ...cortesiasAno].filter(v => Number(v.valor_total) === 0).map(v => v.id))
      );
      const itensByVenda = new Map<string, number>();
      if (allCortesiaIds.length > 0) {
        const [itensResult, produtosResult] = await Promise.all([
          supabase.from('vendas_itens')
            .select('venda_id, tipo, item_id, quantidade, preco_unitario')
            .in('venda_id', allCortesiaIds),
          supabase.from('painel_produtos').select('id, preco'),
        ]);
        const servicoPreco = new Map<string, number>();
        (servicosResult.data || []).forEach((s: any) => servicoPreco.set(s.id, Number(s.preco || 0)));
        const produtoPreco = new Map<string, number>();
        (produtosResult.data || []).forEach((p: any) => produtoPreco.set(p.id, Number(p.preco || 0)));

        (itensResult.data || []).forEach((it: any) => {
          const tipo = String(it.tipo || '').toLowerCase();
          const qtd = Number(it.quantidade || 1);
          let unit = Number(it.preco_unitario || 0);
          if (unit === 0) {
            if (tipo.includes('produto')) unit = produtoPreco.get(it.item_id) || 0;
            else unit = servicoPreco.get(it.item_id) || 0;
          }
          itensByVenda.set(it.venda_id, (itensByVenda.get(it.venda_id) || 0) + unit * qtd);
        });
      }

      const valorCortesia = (v: { id: string; valor_total: number | null }) => {
        const valor = Number(v.valor_total || 0);
        if (valor > 0) return valor;
        return itensByVenda.get(v.id) || 0;
      };

      const cortesiasQtd = cortesiasMes.length;
      const cortesiasValorPotencial = cortesiasMes.reduce((s, v) => s + valorCortesia(v), 0);
      const cortesiasAnoQtd = cortesiasAno.length;
      const cortesiasAnoValor = cortesiasAno.reduce((s, v) => s + valorCortesia(v), 0);

      return {
        totalClientes,
        clientesAtivosMes,
        ticketMedio,
        totalGorjetas,
        agendamentosHoje,
        agendamentosFuturos,
        taxaConversao,
        concluidosMes,
        receitaAnual,
        cortesiasQtd,
        cortesiasValorPotencial,
        cortesiasAnoQtd,
        cortesiasAnoValor,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyExact = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const cards: Array<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
    subtitle: string;
    explanation: string;
    extra?: React.ReactNode;
  }> = [
    {
      title: 'Clientes Total', value: metrics?.totalClientes || 0, icon: Users,
      color: 'text-blue-600', bgColor: 'bg-blue-50',
      subtitle: `${metrics?.clientesAtivosMes || 0} ativos este mês`,
      explanation:
        'Total: contagem de TODOS os clientes cadastrados na base (painel_clientes), independente de mês.\n\nAtivos este mês: clientes únicos que tiveram pelo menos 1 venda paga no mês selecionado (vendas.cliente_id DISTINCT).',
    },
    {
      title: 'Concluídos no Mês', value: metrics?.concluidosMes || 0, icon: CheckCircle,
      color: 'text-green-600', bgColor: 'bg-green-50',
      subtitle: `Taxa: ${(metrics?.taxaConversao || 0).toFixed(1)}%`,
      explanation:
        'Quantidade de agendamentos com status "concluido" (atendimento realizado) no mês selecionado.\n\nFonte: painel_agendamentos\nFiltro: status = concluido AND data dentro do mês\nFórmula: COUNT(*)',
    },
    {
      title: 'Ticket Médio', value: formatCurrency(metrics?.ticketMedio || 0), icon: Receipt,
      color: 'text-emerald-600', bgColor: 'bg-emerald-50',
      subtitle: 'Valor médio por venda',
      explanation:
        'Quanto cada cliente gasta em média por venda no mês.\n\nFórmula: SOMA(valor_total) ÷ QUANTIDADE de vendas pagas\n\nFonte: vendas (status = pago) no mês selecionado',
    },
    {
      title: 'Receita Bruta Anual', value: formatCurrency(metrics?.receitaAnual || 0), icon: DollarSign,
      color: 'text-violet-600', bgColor: 'bg-violet-50',
      subtitle: `Ano ${year}`,
      explanation:
        'Total recebido em TODO o ano selecionado (jan a dez).\n\nFonte: contas_receber\nFiltro: status IN (pago, recebido) AND data_vencimento dentro do ano\nFórmula: SUM(valor)\n\nObs: cortesias NÃO entram aqui — são exibidas separadamente abaixo para você acompanhar o impacto no faturamento.',
      extra: (
        <div className="mt-2 space-y-1">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded bg-violet-50 px-1.5 py-1 border border-violet-100">
              <p className="text-[9px] text-violet-700 font-medium">Recebido</p>
              <p className="text-[11px] sm:text-xs font-bold text-violet-700 truncate">{formatCurrencyExact(metrics?.receitaAnual || 0)}</p>
            </div>
            <div className="rounded bg-rose-50 px-1.5 py-1 border border-rose-100">
              <p className="text-[9px] text-rose-700 font-medium">Cortesias ({metrics?.cortesiasAnoQtd || 0})</p>
              <p className="text-[11px] sm:text-xs font-bold text-rose-700 truncate">~{formatCurrencyExact(metrics?.cortesiasAnoValor || 0)}</p>
            </div>
          </div>
          <div className="rounded bg-slate-50 px-1.5 py-1 border border-slate-200 flex items-center justify-between">
            <p className="text-[9px] text-slate-600 font-medium">Total potencial</p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">{formatCurrencyExact((metrics?.receitaAnual || 0) + (metrics?.cortesiasAnoValor || 0))}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Gorjetas do Mês', value: formatCurrency(metrics?.totalGorjetas || 0), icon: Gift,
      color: 'text-pink-600', bgColor: 'bg-pink-50',
      subtitle: 'Repassadas aos barbeiros',
      explanation:
        'Total de gorjetas no mês.\n\nFonte 1: campo "gorjeta" das vendas pagas\nFonte 2: barber_commissions com tipo = "gorjeta"\n\nFórmula: SOMA das duas fontes (campo nas vendas é o registro principal; comissões garantem que o barbeiro receba o valor).',
    },
    {
      title: 'Cortesias do Mês',
      value: `${metrics?.cortesiasQtd || 0}`,
      icon: HeartHandshake,
      color: 'text-rose-600', bgColor: 'bg-rose-50',
      subtitle: `~${formatCurrency(metrics?.cortesiasValorPotencial || 0)} se cobrado`,
      explanation:
        'Atendimentos OFERECIDOS GRATUITAMENTE no mês.\n\nFontes (tabela vendas, status = pago):\n• Vendas com valor_total = 0\n• Vendas marcadas como "cortesia" no campo observações ou forma de pagamento (override administrativo)\n\nValor potencial: estima quanto teria sido faturado se essas cortesias tivessem sido cobradas (usa o ticket médio do mês como referência para vendas zeradas).\n\nUse este card para identificar excesso de cortesias.',
    },
    {
      title: 'Agendamentos Hoje', value: metrics?.agendamentosHoje || 0, icon: Calendar,
      color: 'text-amber-600', bgColor: 'bg-amber-50',
      subtitle: 'Para hoje',
      explanation:
        'Total de agendamentos marcados para HOJE (independente de status).\n\nFonte: painel_agendamentos\nFiltro: data = hoje (fuso de Brasília)\nFórmula: COUNT(*)\n\nObservação: este card sempre mostra "hoje" e ignora o filtro de mês.',
    },
    {
      title: 'Agenda Futura', value: metrics?.agendamentosFuturos || 0, icon: TrendingUp,
      color: 'text-cyan-600', bgColor: 'bg-cyan-50',
      subtitle: 'Próximos dias (status agendado)',
      explanation:
        'Quantidade de agendamentos com status "agendado" para datas APÓS hoje.\n\nFonte: painel_agendamentos\nFiltro: data > hoje AND status = agendado\nFórmula: COUNT(*)\n\nObservação: este card sempre mostra "futuro" e ignora o filtro de mês.',
    },
    {
      title: 'Taxa de Conversão', value: `${(metrics?.taxaConversao || 0).toFixed(1)}%`, icon: Target,
      color: 'text-indigo-600', bgColor: 'bg-indigo-50',
      subtitle: 'Agendados → Concluídos',
      explanation:
        'Percentual de agendamentos do mês que foram efetivamente concluídos (cliente compareceu e foi atendido).\n\nFórmula: (Agendamentos com status "concluido" ÷ TOTAL de agendamentos do mês) × 100\n\nFonte: painel_agendamentos no mês selecionado.\n\nUse para identificar faltas (no-show) e cancelamentos.',
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-400 hover:text-gray-700 transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
                      {card.explanation}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-600 font-medium truncate">{card.title}</p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{card.subtitle}</p>
                {card.extra}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default OperationalMetricsCards;
