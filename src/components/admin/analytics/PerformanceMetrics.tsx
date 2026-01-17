
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Target, TrendingUp, Award, Zap } from 'lucide-react';

const PerformanceMetrics: React.FC = () => {
  const queryKey = useMemo(() => ['performance-metrics'], []);

  const { data: performanceData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Buscar agendamentos do painel
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(nome, preco),
          painel_barbeiros(nome),
          painel_clientes(nome)
        `);

      // Buscar dados do cash flow
      const { data: cashFlow } = await supabase
        .from('cash_flow')
        .select('*');

      // Buscar comissões
      const { data: commissions } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          staff:staff_id(name)
        `);

      // Performance por barbeiro
      const staffPerformance = appointments?.reduce((acc, apt) => {
        const staffName = apt.painel_barbeiros?.nome || 'Não atribuído';
        if (!acc[staffName]) {
          acc[staffName] = { 
            name: staffName, 
            appointments: 0, 
            completed: 0, 
            revenue: 0
          };
        }
        acc[staffName].appointments += 1;
        if (apt.status === 'concluido') {
          acc[staffName].completed += 1;
          acc[staffName].revenue += apt.painel_servicos?.preco || 0;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const staffData = Object.values(staffPerformance).map((staff: any) => ({
        ...staff,
        completionRate: staff.appointments > 0 ? (staff.completed / staff.appointments) * 100 : 0,
        avgRevenue: staff.completed > 0 ? staff.revenue / staff.completed : 0
      }));

      // Métricas de performance geral
      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(apt => apt.status === 'concluido').length || 0;
      const totalRevenue = appointments?.reduce((sum, apt) => 
        sum + (apt.status === 'concluido' ? (apt.painel_servicos?.preco || 0) : 0), 0) || 0;
      
      // Adicionar receita do cash flow
      const cashFlowRevenue = cashFlow?.reduce((sum, transaction) => 
        sum + (transaction.transaction_type === 'income' ? transaction.amount : 0), 0) || 0;

      const totalCombinedRevenue = totalRevenue + cashFlowRevenue;

      // Calcular métricas reais baseadas em dados
      const efficiency = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
      const revenueScore = totalCombinedRevenue > 0 ? Math.min((totalCombinedRevenue / 50000) * 100, 100) : 0;
      
      // Calcular taxa de retenção real (clientes que retornaram)
      const clientAppointments = appointments?.reduce((acc, apt) => {
        const clientName = apt.painel_clientes?.nome;
        if (clientName) {
          acc[clientName] = (acc[clientName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};
      
      const totalClients = Object.keys(clientAppointments).length;
      const returningClients = Object.values(clientAppointments).filter(count => count > 1).length;
      const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

      // Calcular pontualidade (agendamentos não cancelados / total)
      const cancelledAppointments = appointments?.filter(apt => apt.status === 'cancelado').length || 0;
      const punctualityRate = totalAppointments > 0 ? ((totalAppointments - cancelledAppointments) / totalAppointments) * 100 : 0;

      // Calcular qualidade (baseado na taxa de conclusão por barbeiro)
      const qualityScore = staffData.length > 0 
        ? staffData.reduce((sum, staff) => sum + staff.completionRate, 0) / staffData.length 
        : 0;

      // Performance score geral (média ponderada)
      const performanceScore = Math.round(
        (efficiency * 0.25) + 
        (revenueScore * 0.25) + 
        (retentionRate * 0.2) + 
        (punctualityRate * 0.15) + 
        (qualityScore * 0.15)
      );

      const performanceRadar = [
        { metric: 'Eficiência', value: Math.round(efficiency) },
        { metric: 'Receita', value: Math.round(revenueScore) },
        { metric: 'Retenção', value: Math.round(retentionRate) },
        { metric: 'Pontualidade', value: Math.round(punctualityRate) },
        { metric: 'Qualidade', value: Math.round(qualityScore) }
      ];

      return {
        totalAppointments,
        completedAppointments,
        totalRevenue: totalCombinedRevenue,
        serviceRevenue: totalRevenue,
        cashFlowRevenue,
        avgTicket: completedAppointments > 0 ? totalRevenue / completedAppointments : 0,
        efficiency: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        staffData,
        performanceRadar,
        performanceScore
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5 // 5 minutes
  });

  const metrics = useMemo(() => [
    {
      title: 'Eficiência Geral',
      value: `${performanceData?.efficiency?.toFixed(1) || '0'}%`,
      icon: Target,
      color: 'text-blue-400'
    },
    {
      title: 'Receita Total',
      value: `R$ ${performanceData?.totalRevenue?.toLocaleString('pt-BR') || '0'}`,
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${performanceData?.avgTicket?.toFixed(2) || '0'}`,
      icon: Award,
      color: 'text-purple-400'
    },
    {
      title: 'Performance Score',
      value: `${performanceData?.performanceScore || 0}/100`,
      icon: Zap,
      color: 'text-yellow-400'
    }
  ], [performanceData]);

  if (isLoading) {
    return (
      <div className="h-full bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
        <p className="text-gray-600">Carregando métricas de performance...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Métricas de Performance</h2>
        <p className="text-sm text-gray-600">Análise de desempenho e eficiência operacional</p>
      </div>

      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{metric.title}</p>
                      <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    </div>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar de Performance */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData?.performanceRadar || []}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar 
                        name="Performance" 
                        dataKey="value" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance por Barbeiro */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance por Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData?.staffData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="completionRate" fill="#3B82F6" name="Taxa de Conclusão %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Performance */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Ranking de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData?.staffData?.sort((a: any, b: any) => b.completionRate - a.completionRate).map((staff: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-orange-500 text-black' : 
                        'bg-gray-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-600">{staff.completed} agendamentos concluídos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{staff.completionRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">R$ {staff.revenue.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown de Receita */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Breakdown de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Receita de Serviços</span>
                  <span className="text-green-600 font-semibold">R$ {performanceData?.serviceRevenue?.toLocaleString('pt-BR') || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Receita Adicional (Caixa)</span>
                  <span className="text-blue-600 font-semibold">R$ {performanceData?.cashFlowRevenue?.toLocaleString('pt-BR') || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-t border-gray-300">
                  <span className="text-gray-900 font-bold">Total</span>
                  <span className="text-yellow-600 font-bold">R$ {performanceData?.totalRevenue?.toLocaleString('pt-BR') || '0'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
