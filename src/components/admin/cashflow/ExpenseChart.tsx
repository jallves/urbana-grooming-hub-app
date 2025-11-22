import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/utils/categoryMappings';

const COLORS = {
  'Insumos': '#991b1b', // red-800 - muito profissional
  'Aluguel': '#9a3412', // orange-800 - muito profissional
  'Utilidades': '#92400e', // amber-800 - muito profissional
  'Marketing': '#9f1239', // pink-800 - muito profissional
  'Despesas Gerais': '#334155', // slate-700 - muito profissional
  'Pagamento de Funcionários': '#5b21b6', // violet-800 - muito profissional
  'Comissão': '#155e75', // cyan-800 - muito profissional
  'Comissões': '#3730a3', // indigo-800 - muito profissional
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
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={false}
          outerRadius="60%"
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: number, name: string) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            name
          ]}
        />
        <Legend 
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          formatter={(value, entry: any) => {
            const percent = ((entry.payload.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0);
            return `${value} (${percent}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
