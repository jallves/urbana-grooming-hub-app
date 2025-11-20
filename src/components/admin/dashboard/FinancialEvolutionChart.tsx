import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialEvolutionChart: React.FC = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['financial-evolution-chart'],
    queryFn: async () => {
      const months = [];
      const now = new Date();

      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data } = await supabase
          .from('financial_records')
          .select('transaction_type, status, net_amount')
          .gte('transaction_date', firstDay)
          .lte('transaction_date', lastDay)
          .eq('status', 'completed');

        const revenue = data?.filter(r => r.transaction_type === 'revenue').reduce((sum, r) => sum + r.net_amount, 0) || 0;
        const expenses = data?.filter(r => r.transaction_type === 'expense').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;
        const commissions = data?.filter(r => r.transaction_type === 'commission').reduce((sum, r) => sum + Math.abs(r.net_amount), 0) || 0;
        const profit = revenue - expenses - commissions;

        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
          receita: revenue,
          despesas: expenses,
          comissoes: commissions,
          lucro: profit,
        });
      }

      return months;
    },
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Evolução Financeira (Últimos 6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="receita" 
              stroke="#16a34a" 
              strokeWidth={2}
              name="Receita"
              dot={{ fill: '#16a34a', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#dc2626" 
              strokeWidth={2}
              name="Despesas"
              dot={{ fill: '#dc2626', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="comissoes" 
              stroke="#9333ea" 
              strokeWidth={2}
              name="Comissões"
              dot={{ fill: '#9333ea', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="lucro" 
              stroke="#2563eb" 
              strokeWidth={3}
              name="Lucro Líquido"
              dot={{ fill: '#2563eb', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialEvolutionChart;
