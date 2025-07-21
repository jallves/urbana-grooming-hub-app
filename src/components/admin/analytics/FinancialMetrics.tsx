
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';

const FinancialMetrics: React.FC = () => {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-metrics'],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('status', 'completed')
        .order('start_time', { ascending: true });

      // Agrupar por mês
      const monthlyData = appointments?.reduce((acc, apt) => {
        const month = new Date(apt.start_time).toLocaleString('pt-BR', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, revenue: 0, count: 0 };
        }
        acc[month].revenue += apt.services?.price || 0;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      const monthlyRevenue = Object.values(monthlyData);

      // Calcular métricas
      const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.services?.price || 0), 0) || 0;
      const avgTicket = appointments?.length ? totalRevenue / appointments.length : 0;
      const thisMonth = new Date().getMonth();
      const currentMonthRevenue = appointments?.filter(apt => 
        new Date(apt.start_time).getMonth() === thisMonth
      ).reduce((sum, apt) => sum + (apt.services?.price || 0), 0) || 0;

      return {
        totalRevenue,
        avgTicket,
        currentMonthRevenue,
        monthlyRevenue: monthlyRevenue.slice(-6), // Últimos 6 meses
        growth: 12.5 // Simulado
      };
    }
  });

  const metrics = [
    {
      title: 'Receita Total',
      value: `R$ ${financialData?.totalRevenue?.toLocaleString('pt-BR') || '0'}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${financialData?.avgTicket?.toFixed(2) || '0'}`,
      change: '+8.3%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-400'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${financialData?.currentMonthRevenue?.toLocaleString('pt-BR') || '0'}`,
      change: '+15.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="h-full bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-gray-100">Métricas Financeiras</h2>
        <p className="text-sm text-gray-400">Análise de receita e performance financeira</p>
      </div>

      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{metric.title}</p>
                      <p className="text-lg font-bold text-gray-100">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className="text-xs text-green-400">{metric.change}</span>
                      </div>
                    </div>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de Receita */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialData?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Receita"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Receita por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinancialMetrics;
