
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const COLORS = ['#4ade80', '#22c55e', '#fde68a', '#f87171', '#a78bfa'];

const FinanceReports: React.FC = () => {
  // Fetch monthly data for the last 6 months
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['finance-monthly-data'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        const monthName = format(date, 'MMM');

        // Fetch income from appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('services!inner(price), discount_amount')
          .eq('status', 'completed')
          .gte('start_time', startDate)
          .lte('start_time', endDate);

        // Fetch expenses from cash_flow
        const { data: expenses } = await supabase
          .from('cash_flow')
          .select('amount')
          .eq('transaction_type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        const income = appointments?.reduce((sum, apt) => 
          sum + (apt.services?.price || 0) - (apt.discount_amount || 0), 0
        ) || 0;

        const expense = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

        months.push({
          month: monthName,
          income,
          expense
        });
      }
      return months;
    }
  });

  // Fetch service distribution data
  const { data: serviceData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['finance-services-data'],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('services!inner(name, price), discount_amount')
        .eq('status', 'completed')
        .gte('start_time', format(startOfMonth(new Date()), 'yyyy-MM-dd'));

      if (!appointments?.length) return [];

      const serviceStats: Record<string, number> = {};
      let totalRevenue = 0;

      appointments.forEach(apt => {
        const serviceName = apt.services?.name || 'Desconhecido';
        const revenue = (apt.services?.price || 0) - (apt.discount_amount || 0);
        serviceStats[serviceName] = (serviceStats[serviceName] || 0) + revenue;
        totalRevenue += revenue;
      });

      return Object.entries(serviceStats).map(([name, value]) => ({
        name,
        value: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
      }));
    }
  });

  // Fetch financial summary
  const { data: financialSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Current month income from appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('services!inner(price), discount_amount')
        .eq('status', 'completed')
        .gte('start_time', currentMonth)
        .lte('start_time', currentMonthEnd);

      // Current month expenses
      const { data: expenses } = await supabase
        .from('cash_flow')
        .select('amount')
        .eq('transaction_type', 'expense')
        .gte('transaction_date', currentMonth)
        .lte('transaction_date', currentMonthEnd);

      const totalIncome = appointments?.reduce((sum, apt) => 
        sum + (apt.services?.price || 0) - (apt.discount_amount || 0), 0
      ) || 0;

      const totalExpense = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const profit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
      const averageTicket = appointments?.length ? totalIncome / appointments.length : 0;

      return {
        totalIncome,
        totalExpense,
        profit,
        profitMargin,
        averageTicket
      };
    }
  });

  if (isLoadingMonthly || isLoadingServices || isLoadingSummary) {
    return (
      <div className="flex items-center justify-center py-10 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 p-4 min-h-screen text-white">
      <Card className="w-full bg-gray-800 border border-gray-700 shadow-none">
        <CardHeader>
          <CardTitle className="text-white">Receitas vs Despesas</CardTitle>
          <CardDescription className="text-gray-400">
            Comparação de receitas e despesas dos últimos 6 meses (dados reais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#bbb" />
                <YAxis stroke="#bbb" />
                <Tooltip
                  wrapperStyle={{ backgroundColor: '#1f2937', borderRadius: 4, border: 'none' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderRadius: 4 }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend wrapperStyle={{ color: 'white' }} />
                <Bar dataKey="income" name="Receitas" fill="#4ade80" />
                <Bar dataKey="expense" name="Despesas" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border border-gray-700 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Distribuição por Serviços</CardTitle>
            <CardDescription className="text-gray-400">
              Porcentagem de receita por tipo de serviço (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceData && serviceData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ backgroundColor: '#1f2937', borderRadius: 4, border: 'none' }}
                      contentStyle={{ backgroundColor: '#1f2937', borderRadius: 4 }}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, undefined]}
                      labelStyle={{ color: 'white' }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum agendamento concluído encontrado para análise.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Resumo Financeiro</CardTitle>
            <CardDescription className="text-gray-400">
              Resumo das métricas financeiras do mês atual (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Total Receitas (Mês Atual)', value: financialSummary?.totalIncome, color: 'text-green-500' },
                { label: 'Total Despesas (Mês Atual)', value: financialSummary?.totalExpense, color: 'text-red-500' },
                { 
                  label: 'Lucro (Mês Atual)', 
                  value: financialSummary?.profit, 
                  color: (financialSummary?.profit || 0) >= 0 ? 'text-blue-500' : 'text-red-500' 
                },
                { label: 'Margem de Lucro', value: financialSummary?.profitMargin, isPercent: true },
                { label: 'Ticket Médio', value: financialSummary?.averageTicket }
              ].map(({ label, value, color, isPercent }, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                  <span className={`text-lg font-bold ${color ?? 'text-white'}`}>
                    {value !== undefined && value !== null ? (
                      isPercent ? `${value.toFixed(1)}%` : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    ) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReports;
