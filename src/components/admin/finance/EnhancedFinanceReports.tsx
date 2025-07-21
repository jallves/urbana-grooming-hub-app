
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target, Download } from 'lucide-react';

const COLORS = ['#FFD700', '#4ade80', '#f87171', '#a78bfa', '#06b6d4', '#f59e0b'];

const EnhancedFinanceReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dados financeiros consolidados
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['enhanced-financial-data', selectedPeriod, selectedMonth, selectedYear],
    queryFn: async () => {
      let startDate: string;
      let endDate: string;

      if (selectedPeriod === 'monthly') {
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
        const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
        startDate = format(monthStart, 'yyyy-MM-dd');
        endDate = format(monthEnd, 'yyyy-MM-dd');
      } else {
        const yearStart = startOfYear(new Date(selectedYear, 0));
        const yearEnd = endOfYear(new Date(selectedYear, 0));
        startDate = format(yearStart, 'yyyy-MM-dd');
        endDate = format(yearEnd, 'yyyy-MM-dd');
      }

      // Buscar dados do cash flow
      const { data: cashFlow, error: cfError } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (cfError) throw cfError;

      // Buscar comissões com join correto para staff
      const { data: commissions, error: commError } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          staff:staff_id (
            name
          )
        `)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (commError) throw commError;

      // Buscar agendamentos concluídos
      const { data: appointments, error: appError } = await supabase
        .from('painel_agendamentos')
        .select('*, painel_servicos(preco), painel_barbeiros(nome)')
        .eq('status', 'concluido')
        .gte('data', startDate)
        .lte('data', endDate);

      if (appError) throw appError;

      return {
        cashFlow: cashFlow || [],
        commissions: commissions || [],
        appointments: appointments || []
      };
    },
  });

  // Dados de evolução mensal
  const { data: monthlyEvolution } = useQuery({
    queryKey: ['monthly-evolution', selectedYear],
    queryFn: async () => {
      const months = [];
      
      for (let i = 0; i < 12; i++) {
        const monthStart = startOfMonth(new Date(selectedYear, i));
        const monthEnd = endOfMonth(new Date(selectedYear, i));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        const { data: monthCashFlow } = await supabase
          .from('cash_flow')
          .select('*')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        const { data: monthCommissions } = await supabase
          .from('barber_commissions')
          .select('*')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);

        const income = monthCashFlow?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const expenses = monthCashFlow?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const commissions = monthCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        months.push({
          month: format(monthStart, 'MMM', { locale: ptBR }),
          monthNum: i,
          receita: income,
          despesas: expenses,
          comissoes: commissions,
          lucro: income - expenses - commissions,
        });
      }

      return months;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
      </div>
    );
  }

  const totalIncome = financialData?.cashFlow?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalExpenses = financialData?.cashFlow?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalCommissions = financialData?.commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const netProfit = totalIncome - totalExpenses - totalCommissions;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Análise por categoria
  const categoryAnalysis = financialData?.cashFlow?.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expense: 0 };
    }
    if (transaction.transaction_type === 'income') {
      acc[transaction.category].income += Number(transaction.amount);
    } else {
      acc[transaction.category].expense += Number(transaction.amount);
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>) || {};

  const categoryData = Object.entries(categoryAnalysis).map(([category, data]) => ({
    category,
    receita: data.income,
    despesa: data.expense,
    saldo: data.income - data.expense,
  }));

  // Análise de comissões por barbeiro - corrigindo o acesso ao nome
  const barberCommissions = financialData?.commissions?.reduce((acc, commission) => {
    const barberName = (commission.staff as any)?.name || 'Barbeiro';
    if (!acc[barberName]) {
      acc[barberName] = { total: 0, count: 0 };
    }
    acc[barberName].total += Number(commission.amount);
    acc[barberName].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>) || {};

  const barberData = Object.entries(barberCommissions).map(([name, data]) => ({
    name,
    total: data.total,
    media: data.total / data.count,
    servicos: data.count,
  }));

  return (
    <div className="space-y-6 bg-gray-900 p-6 min-h-screen text-white">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>

        {selectedPeriod === 'monthly' && (
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(2024, i), 'MMMM', { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Button className="bg-urbana-gold text-black hover:bg-urbana-gold/90">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-400" />
              Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-urbana-gold" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>
              R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              Margem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {profitMargin.toFixed(1)}%
              </div>
              <Badge variant={profitMargin >= 20 ? 'default' : profitMargin >= 10 ? 'secondary' : 'destructive'}>
                {profitMargin >= 20 ? 'Excelente' : profitMargin >= 10 ? 'Bom' : 'Baixo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-urbana-gold">Evolução Mensal {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="receita" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Receita" />
                  <Area type="monotone" dataKey="despesas" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Despesas" />
                  <Area type="monotone" dataKey="comissoes" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Comissões" />
                  <Line type="monotone" dataKey="lucro" stroke="#FFD700" strokeWidth={3} name="Lucro" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análise por Categoria */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-urbana-gold">Análise por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="receita" fill="#10B981" name="Receita" />
                  <Bar dataKey="despesa" fill="#EF4444" name="Despesa" />
                  <Bar dataKey="saldo" fill="#FFD700" name="Saldo" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comissões por Barbeiro */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-urbana-gold">Comissões por Barbeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={barberData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {barberData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ranking de Performance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-urbana-gold">Ranking de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {barberData.sort((a, b) => b.total - a.total).map((barber, index) => (
                <div key={barber.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-orange-600 text-white' : 
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{barber.name}</div>
                      <div className="text-sm text-gray-400">{barber.servicos} serviços</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-urbana-gold">
                      R$ {barber.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-400">
                      Média: R$ {barber.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedFinanceReports;
