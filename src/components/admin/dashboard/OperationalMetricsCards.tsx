import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Receipt, Target, Gift, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const OperationalMetricsCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['operational-metrics-dashboard'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      // Parallel queries for better performance
      const [
        clientesResult,
        vendasMesResult,
        agendamentosHojeResult,
        agendamentosFuturosResult,
        agendamentosTotaisResult,
        gorjetasResult
      ] = await Promise.all([
        // Total clientes
        supabase.from('painel_clientes').select('id', { count: 'exact', head: true }),
        // Vendas do mês (clientes únicos ativos)
        supabase
          .from('vendas')
          .select('cliente_id, valor_total, gorjeta')
          .gte('created_at', firstDayOfMonth)
          .eq('status', 'pago'),
        // Agendamentos hoje
        supabase
          .from('painel_agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('data', todayStr),
        // Agendamentos futuros
        supabase
          .from('painel_agendamentos')
          .select('id', { count: 'exact', head: true })
          .gt('data', todayStr)
          .eq('status', 'agendado'),
        // Total agendamentos e concluídos
        supabase
          .from('painel_agendamentos')
          .select('status'),
        // Total gorjetas do mês
        supabase
          .from('vendas')
          .select('gorjeta')
          .gte('created_at', firstDayOfMonth)
          .eq('status', 'pago')
      ]);

      // Calculate metrics
      const totalClientes = clientesResult.count || 0;
      
      const vendasMes = vendasMesResult.data || [];
      const clientesAtivosMes = new Set(vendasMes.map(v => v.cliente_id).filter(Boolean)).size;
      const ticketMedio = vendasMes.length > 0 
        ? vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendasMes.length 
        : 0;
      
      const totalGorjetas = gorjetasResult.data?.reduce((sum, v) => sum + (v.gorjeta || 0), 0) || 0;
      
      const agendamentosHoje = agendamentosHojeResult.count || 0;
      const agendamentosFuturos = agendamentosFuturosResult.count || 0;
      
      const agendamentosTotais = agendamentosTotaisResult.data || [];
      const totalAgendamentos = agendamentosTotais.length;
      const concluidos = agendamentosTotais.filter(a => a.status === 'concluido').length;
      const taxaConversao = totalAgendamentos > 0 ? (concluidos / totalAgendamentos) * 100 : 0;

      return {
        totalClientes,
        clientesAtivosMes,
        ticketMedio,
        totalGorjetas,
        agendamentosHoje,
        agendamentosFuturos,
        taxaConversao,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
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
    {
      title: 'Clientes Total',
      value: metrics?.totalClientes || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${metrics?.clientesAtivosMes || 0} ativos este mês`,
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(metrics?.ticketMedio || 0),
      icon: Receipt,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: 'Por venda',
    },
    {
      title: 'Taxa Conversão',
      value: `${(metrics?.taxaConversao || 0).toFixed(1)}%`,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subtitle: 'Agendados → Concluídos',
    },
    {
      title: 'Gorjetas do Mês',
      value: formatCurrency(metrics?.totalGorjetas || 0),
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      subtitle: 'Total recebido',
    },
    {
      title: 'Agendamentos Hoje',
      value: metrics?.agendamentosHoje || 0,
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      subtitle: 'Para hoje',
    },
    {
      title: 'Agenda Futura',
      value: metrics?.agendamentosFuturos || 0,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      subtitle: 'Próximos dias',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs text-gray-600 font-medium truncate">
                {card.title}
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OperationalMetricsCards;
