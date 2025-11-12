
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FinancialMetrics: React.FC = () => {
  const queryKey = useMemo(() => ['financial-metrics'], []);

  const { data: financialData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Buscar agendamentos do painel com serviços
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(preco),
          painel_clientes(nome)
        `)
        .eq('status', 'concluido')
        .order('data', { ascending: true });

      // Buscar fluxo de caixa
      const { data: cashFlow } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('transaction_type', 'income')
        .order('transaction_date', { ascending: true });

      // Agrupar por mês
      const monthlyData = appointments?.reduce((acc, apt) => {
        const month = format(parseISO(apt.data), 'MMM', { locale: ptBR });
        if (!acc[month]) {
          acc[month] = { month, revenue: 0, count: 0 };
        }
        acc[month].revenue += apt.painel_servicos?.preco || 0;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      // Adicionar receita do cash flow
      cashFlow?.forEach(transaction => {
        const month = new Date(transaction.transaction_date).toLocaleString('pt-BR', { month: 'short' });
        if (monthlyData[month]) {
          monthlyData[month].revenue += transaction.amount;
        } else {
          monthlyData[month] = { month, revenue: transaction.amount, count: 0 };
        }
      });

      const monthlyRevenue = Object.values(monthlyData);

      // Calcular métricas
      const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.painel_servicos?.preco || 0), 0) || 0;
      const cashFlowRevenue = cashFlow?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
      const totalCombinedRevenue = totalRevenue + cashFlowRevenue;
      
      const avgTicket = appointments?.length ? totalRevenue / appointments.length : 0;
      const thisMonth = new Date().getMonth();
      const currentMonthRevenue = appointments?.filter(apt => 
        parseISO(apt.data).getMonth() === thisMonth
      ).reduce((sum, apt) => sum + (apt.painel_servicos?.preco || 0), 0) || 0;

      const currentMonthCashFlow = cashFlow?.filter(transaction => 
        new Date(transaction.transaction_date).getMonth() === thisMonth
      ).reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

      return {
        totalRevenue: totalCombinedRevenue,
        serviceRevenue: totalRevenue,
        cashFlowRevenue,
        avgTicket,
        currentMonthRevenue: currentMonthRevenue + currentMonthCashFlow,
        monthlyRevenue: monthlyRevenue.slice(-6), // Últimos 6 meses
        growth: 12.5 // Simulado
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5 // 5 minutes
  });

  const metrics = useMemo(() => [
    {
      title: 'Receita Total',
      value: `R$ ${financialData?.totalRevenue?.toLocaleString('pt-BR') || '0'}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      title: 'Receita Serviços',
      value: `R$ ${financialData?.serviceRevenue?.toLocaleString('pt-BR') || '0'}`,
      change: '+8.3%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-400'
    },
    {
      title: 'Receita Adicional',
      value: `R$ ${financialData?.cashFlowRevenue?.toLocaleString('pt-BR') || '0'}`,
      change: '+15.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${financialData?.avgTicket?.toFixed(2) || '0'}`,
      change: '+5.1%',
      trend: 'up',
      icon: Target,
      color: 'text-cyan-400'
    }
  ], [financialData]);

  if (isLoading) {
    return (
      <div className="h-full bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
        <p className="text-gray-600">Carregando métricas financeiras...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Métricas Financeiras</h2>
        <p className="text-sm text-gray-600">Análise de receita e performance financeira</p>
      </div>

      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{metric.title}</p>
                      <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-xs text-green-600">{metric.change}</span>
                      </div>
                    </div>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de Receita */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialData?.monthlyRevenue || []}>
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
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Receita por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData?.monthlyRevenue || []}>
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
