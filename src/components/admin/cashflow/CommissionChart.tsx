import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = {
  'Comissões - Serviços': '#8b5cf6', // violet-500
  'Comissões - Produtos': '#06b6d4', // cyan-500
  'Outras Comissões': '#6366f1', // indigo-500
};

const CommissionChart: React.FC = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['commission-chart'],
    queryFn: async () => {
      const currentMonth = new Date();
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'commission')
        .eq('status', 'completed')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar dados de comissões:', error);
        throw error;
      }

      // Agrupar por categoria
      const categoryTotals: Record<string, number> = {};
      data?.forEach(transaction => {
        const category = transaction.category;
        let categoryLabel = 'Outras Comissões';
        
        if (category === 'services' || category === 'commission') categoryLabel = 'Comissões - Serviços';
        else if (category === 'products') categoryLabel = 'Comissões - Produtos';
        
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
        <p className="text-gray-400">Nenhuma comissão encontrada este mês</p>
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

export default CommissionChart;
