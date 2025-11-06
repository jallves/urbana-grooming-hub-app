
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Users, UserPlus, UserCheck, Star } from 'lucide-react';

const ClientMetrics: React.FC = () => {
  const queryKey = useMemo(() => ['client-metrics'], []);

  const { data: clientData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Buscar clientes do painel
      const { data: clients } = await supabase
        .from('painel_clientes')
        .select('*');

      // Buscar agendamentos do painel
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome)
        `);

      // Clientes por mês
      const monthlyClients = clients?.reduce((acc, client) => {
        const month = new Date(client.created_at).toLocaleString('pt-BR', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, count: 0 };
        }
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      const monthlyData = Object.values(monthlyClients).slice(-6);

      // Clientes frequentes
      const clientFrequency = appointments?.reduce((acc, apt) => {
        const clientName = apt.painel_clientes?.nome || 'Sem nome';
        acc[clientName] = (acc[clientName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topClients = Object.entries(clientFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Métricas
      const totalClients = clients?.length || 0;
      const newThisMonth = clients?.filter(client => {
        const clientDate = new Date(client.created_at);
        const thisMonth = new Date();
        return clientDate.getMonth() === thisMonth.getMonth() && 
               clientDate.getFullYear() === thisMonth.getFullYear();
      }).length || 0;

      const activeClients = appointments?.filter(apt => apt.status === 'concluido')
        .reduce((acc, apt) => {
          if (apt.painel_clientes?.nome) {
            acc.add(apt.painel_clientes.nome);
          }
          return acc;
        }, new Set()).size || 0;

      return {
        totalClients,
        newThisMonth,
        activeClients,
        retentionRate: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
        monthlyData,
        topClients
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5 // 5 minutes
  });

  const metrics = useMemo(() => [
    {
      title: 'Total Clientes',
      value: clientData?.totalClients?.toString() || '0',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Novos Este Mês',
      value: clientData?.newThisMonth?.toString() || '0',
      icon: UserPlus,
      color: 'text-green-400'
    },
    {
      title: 'Clientes Ativos',
      value: clientData?.activeClients?.toString() || '0',
      icon: UserCheck,
      color: 'text-purple-400'
    },
    {
      title: 'Taxa de Retenção',
      value: `${clientData?.retentionRate?.toFixed(1) || '0'}%`,
      icon: Star,
      color: 'text-yellow-400'
    }
  ], [clientData]);

  if (isLoading) {
    return (
      <div className="h-full bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
        <p className="text-gray-600">Carregando métricas de clientes...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Métricas de Clientes</h2>
        <p className="text-sm text-gray-600">Análise de base de clientes e comportamento</p>
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
            {/* Crescimento de Clientes */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Crescimento de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clientData?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Novos Clientes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Clientes Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientData?.topClients || []}>
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
                      <Bar dataKey="count" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Insights de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Taxa de crescimento mensal</span>
                  <span className="text-green-600 font-semibold">+15.2%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Tempo médio de retenção</span>
                  <span className="text-blue-600 font-semibold">8.5 meses</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Satisfação média</span>
                  <span className="text-yellow-600 font-semibold">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientMetrics;
