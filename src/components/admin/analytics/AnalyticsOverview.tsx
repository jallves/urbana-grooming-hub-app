
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, DollarSign, Target, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AnalyticsOverview: React.FC = () => {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Buscar dados do painel de agendamentos do mês atual
      const { data: currentAppointments } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(preco),
          painel_clientes(nome)
        `)
        .gte('data', firstDayOfMonth.toISOString().split('T')[0])
        .lte('data', today.toISOString().split('T')[0]);

      // Buscar dados do mês anterior
      const { data: lastMonthAppointments } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(preco)
        `)
        .gte('data', lastMonth.toISOString().split('T')[0])
        .lte('data', lastMonthEnd.toISOString().split('T')[0]);

      // Buscar clientes do painel
      const { data: clients } = await supabase
        .from('painel_clientes')
        .select('*');

      // Buscar fluxo de caixa do mês atual
      const { data: cashFlow } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', today.toISOString().split('T')[0]);

      // Calcular métricas
      const currentRevenue = currentAppointments?.reduce((sum, apt) => 
        sum + (apt.status === 'concluido' ? (apt.painel_servicos?.preco || 0) : 0), 0) || 0;
      
      const lastMonthRevenue = lastMonthAppointments?.reduce((sum, apt) => 
        sum + (apt.status === 'concluido' ? (apt.painel_servicos?.preco || 0) : 0), 0) || 0;

      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const completedAppointments = currentAppointments?.filter(apt => apt.status === 'concluido').length || 0;
      const totalAppointments = currentAppointments?.length || 0;
      const conversionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

      const newClientsThisMonth = clients?.filter(client => 
        new Date(client.created_at) >= firstDayOfMonth).length || 0;

      // Calcular receita do cash flow
      const cashFlowRevenue = cashFlow?.reduce((sum, transaction) => 
        sum + (transaction.transaction_type === 'income' ? transaction.amount : 0), 0) || 0;

      const totalRevenue = currentRevenue + cashFlowRevenue;

      return {
        revenue: totalRevenue,
        revenueGrowth,
        appointments: totalAppointments,
        completedAppointments,
        conversionRate,
        newClients: newClientsThisMonth,
        totalClients: clients?.length || 0,
        cashFlowRevenue
      };
    }
  });

  const kpiCards = [
    {
      title: 'Receita Mensal',
      value: `R$ ${kpis?.revenue?.toLocaleString('pt-BR') || '0'}`,
      change: `${kpis?.revenueGrowth?.toFixed(1) || '0'}%`,
      trend: (kpis?.revenueGrowth || 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Agendamentos',
      value: kpis?.appointments?.toString() || '0',
      change: `${kpis?.completedAppointments || '0'} concluídos`,
      trend: 'up',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Taxa de Conversão',
      value: `${kpis?.conversionRate?.toFixed(1) || '0'}%`,
      change: 'Agendamentos concluídos',
      trend: (kpis?.conversionRate || 0) >= 70 ? 'up' : 'down',
      icon: Target,
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Novos Clientes',
      value: kpis?.newClients?.toString() || '0',
      change: `${kpis?.totalClients || '0'} total`,
      trend: 'up',
      icon: Users,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const alerts = [
    {
      type: 'success',
      message: 'Receita em crescimento este mês',
      icon: TrendingUp
    },
    {
      type: 'warning',
      message: 'Acompanhe a taxa de conversão',
      icon: AlertCircle
    }
  ];

  return (
    <div className="h-full bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-gray-100">Visão Geral - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}</h2>
        <p className="text-sm text-gray-400">Principais métricas e indicadores de performance</p>
      </div>

      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">{kpi.title}</p>
                      <p className="text-xl font-bold text-gray-100">{kpi.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{kpi.change}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-gradient-to-r ${kpi.color}`}>
                      <kpi.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alertas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Alertas e Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <alert.icon className={`h-5 w-5 ${
                    alert.type === 'success' ? 'text-green-400' : 'text-yellow-400'
                  }`} />
                  <span className="text-sm text-gray-300">{alert.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resumo Rápido */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Receita mensal: <span className="text-green-400">R$ {kpis?.revenue?.toLocaleString('pt-BR') || '0'}</span></p>
                <p>• Agendamentos realizados: <span className="text-blue-400">{kpis?.completedAppointments || '0'}</span></p>
                <p>• Taxa de conversão: <span className="text-purple-400">{kpis?.conversionRate?.toFixed(1) || '0'}%</span></p>
                <p>• Novos clientes: <span className="text-orange-400">{kpis?.newClients || '0'}</span></p>
                <p>• Receita adicional (caixa): <span className="text-cyan-400">R$ {kpis?.cashFlowRevenue?.toLocaleString('pt-BR') || '0'}</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
