
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashFlowChart: React.FC = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['cash-flow-chart'],
    queryFn: async () => {
      const months = [];
      
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const { data, error } = await supabase
          .from('cash_flow')
          .select('*')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        if (error) throw error;

        const income = data?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const expense = data?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        months.push({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          receitas: income,
          despesas: expense,
          liquido: income - expense,
        });
      }

      return months;
    },
  });

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6'
          }}
          formatter={(value: number, name: string) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Líquido'
          ]}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Legend 
          wrapperStyle={{ color: '#F3F4F6' }}
        />
        <Line 
          type="monotone" 
          dataKey="receitas" 
          stroke="#10B981" 
          strokeWidth={3}
          name="Receitas"
          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="despesas" 
          stroke="#EF4444" 
          strokeWidth={3}
          name="Despesas"
          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="liquido" 
          stroke="#FFD700" 
          strokeWidth={3}
          name="Líquido"
          dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CashFlowChart;
