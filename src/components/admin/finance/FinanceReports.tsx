
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const FinanceReports: React.FC = () => {
  // Fetch real financial data
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['finance-monthly'],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('transaction_date');
      
      if (error) throw new Error(error.message);
      
      // Group by month
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      const monthlyStats = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthTransactions = transactions?.filter(t => {
          const transactionMonth = new Date(t.transaction_date).getMonth();
          return transactionMonth === monthIndex;
        }) || [];
        
        const income = monthTransactions
          .filter(t => t.transaction_type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const expense = monthTransactions
          .filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        monthlyStats.push({
          month: months[monthIndex],
          income: income,
          expense: expense
        });
      }
      
      return monthlyStats;
    }
  });

  // Fetch service distribution data
  const { data: serviceData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['finance-services'],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, services(name, price)')
        .eq('status', 'completed');
      
      if (error) throw new Error(error.message);
      
      // Group by service type
      const serviceStats = {};
      let totalRevenue = 0;
      
      appointments?.forEach(appointment => {
        const serviceName = appointment.services?.name || 'Outros';
        const servicePrice = Number(appointment.services?.price) || 0;
        
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = 0;
        }
        serviceStats[serviceName] += servicePrice;
        totalRevenue += servicePrice;
      });
      
      // Convert to percentage
      return Object.entries(serviceStats).map(([name, revenue]) => ({
        name,
        value: Math.round((Number(revenue) / totalRevenue) * 100) || 0
      }));
    }
  });

  // Calculate financial summary
  const { data: financialSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('transaction_date', new Date(currentYear, currentMonth + 1, 1).toISOString());
      
      if (error) throw new Error(error.message);
      
      const totalIncome = transactions
        ?.filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
      const totalExpense = transactions
        ?.filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const profit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
      
      // Calculate average ticket from completed appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('status', 'completed')
        .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString());
      
      const averageTicket = appointments?.length > 0 
        ? appointments.reduce((sum, apt) => sum + Number(apt.services?.price || 0), 0) / appointments.length
        : 0;
      
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
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
          <CardDescription>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#4ade80" />
                <Bar dataKey="expense" name="Despesas" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Serviços</CardTitle>
            <CardDescription>
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
                      formatter={(value) => [`${value}%`, undefined]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento concluído encontrado para análise.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>
              Resumo das métricas financeiras do mês atual (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Total Receitas (Mês Atual)</span>
                <span className="text-lg font-bold text-green-600">
                  R$ {financialSummary?.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Total Despesas (Mês Atual)</span>
                <span className="text-lg font-bold text-red-600">
                  R$ {financialSummary?.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Lucro (Mês Atual)</span>
                <span className={`text-lg font-bold ${financialSummary?.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {financialSummary?.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Margem de Lucro</span>
                <span className="text-lg font-bold">
                  {financialSummary?.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ticket Médio</span>
                <span className="text-lg font-bold">
                  R$ {financialSummary?.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReports;
