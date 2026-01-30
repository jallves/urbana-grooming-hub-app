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
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          📈 Evolução Financeira (Últimos 6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="lucroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              style={{ fontSize: '12px', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontSize: '13px',
                padding: '12px 16px'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
              iconType="circle"
              iconSize={10}
            />
            <Line 
              type="monotone" 
              dataKey="receita" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Receita"
              dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="Despesas"
              dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="comissoes" 
              stroke="#a855f7" 
              strokeWidth={3}
              name="Comissões"
              dot={{ fill: '#a855f7', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="lucro" 
              stroke="#3b82f6" 
              strokeWidth={4}
              name="Lucro Líquido"
              dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialEvolutionChart;
