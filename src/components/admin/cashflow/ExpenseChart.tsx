import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/utils/categoryMappings';

const COLORS = {
  'Insumos': '#ef4444', // red-500
  'Aluguel': '#f97316', // orange-500
  'Utilidades': '#f59e0b', // amber-500
  'Marketing': '#ec4899', // pink-500
  'Despesas Gerais': '#64748b', // slate-500
  'Pagamento de Funcionários': '#8b5cf6', // violet-500
  'Comissão': '#06b6d4', // cyan-500
  'Comissões': '#6366f1', // indigo-500
};

interface ExpenseChartProps {
  startDate: string;
  endDate: string;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ startDate, endDate }) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['expense-chart', startDate, endDate],
    queryFn: async () => {
      // Buscar tanto despesas quanto comissões
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .in('transaction_type', ['expense', 'commission'])
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) {
        console.error('Erro ao buscar dados de despesas:', error);
        throw error;
      }

      // Agrupar por categoria
      const categoryTotals: Record<string, number> = {};
      data?.forEach(transaction => {
        const category = transaction.category;
        const categoryLabel = getCategoryLabel(category);
        categoryTotals[categoryLabel] = (categoryTotals[categoryLabel] || 0) + Number(transaction.net_amount);
      });

      // Converter para formato do gráfico
      const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount,
      }));

      return chartData.sort((a, b) => b.value - a.value);
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando gráfico...</div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-400">Nenhuma despesa encontrada no período</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6'
          }}
          formatter={(value: number) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'Valor'
          ]}
        />
        <Legend 
          wrapperStyle={{ color: '#F3F4F6' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
