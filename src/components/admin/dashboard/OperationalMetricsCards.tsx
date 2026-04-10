import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Receipt, Target, Gift, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTodayInBrazil } from '@/lib/utils/dateUtils';

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
        concluidosAnualResult
      ] = await Promise.all([
        supabase.from('painel_clientes').select('id', { count: 'exact', head: true }),
        supabase
          .from('vendas')
          .select('cliente_id, valor_total, gorjeta')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth + 'T23:59:59')
          .eq('status', 'pago'),
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
          .eq('status', 'pago'),
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
          .select('id', { count: 'exact', head: true })
          .gte('data', firstDayOfMonth)
          .lte('data', lastDayOfMonth)
          .eq('status', 'concluido'),
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

      const concluidosMes = concluidosAnualResult.count || 0;

      const receitaAnual = (receitaAnualResult.data || [])
        .filter(r => r.status === 'recebido' || r.status === 'pago')
        .reduce((sum, r) => sum + Number(r.valor), 0);

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
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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

  const cards = [
    { title: 'Clientes Total', value: metrics?.totalClientes || 0, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', subtitle: `${metrics?.clientesAtivosMes || 0} ativos este mês` },
    { title: 'Concluídos no Mês', value: metrics?.concluidosMes || 0, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', subtitle: `Taxa: ${(metrics?.taxaConversao || 0).toFixed(1)}%` },
    { title: 'Ticket Médio', value: formatCurrency(metrics?.ticketMedio || 0), icon: Receipt, color: 'text-emerald-600', bgColor: 'bg-emerald-50', subtitle: 'Por venda' },
    { title: 'Receita Bruta Anual', value: formatCurrency(metrics?.receitaAnual || 0), icon: DollarSign, color: 'text-violet-600', bgColor: 'bg-violet-50', subtitle: `Ano ${year}` },
    { title: 'Gorjetas do Mês', value: formatCurrency(metrics?.totalGorjetas || 0), icon: Gift, color: 'text-pink-600', bgColor: 'bg-pink-50', subtitle: 'Total recebido' },
    { title: 'Agendamentos Hoje', value: metrics?.agendamentosHoje || 0, icon: Calendar, color: 'text-amber-600', bgColor: 'bg-amber-50', subtitle: 'Para hoje' },
    { title: 'Agenda Futura', value: metrics?.agendamentosFuturos || 0, icon: TrendingUp, color: 'text-cyan-600', bgColor: 'bg-cyan-50', subtitle: 'Próximos dias' },
    { title: 'Taxa Conversão', value: `${(metrics?.taxaConversao || 0).toFixed(1)}%`, icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', subtitle: 'Agendados → Concluídos' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-600 font-medium truncate">{card.title}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OperationalMetricsCards;
