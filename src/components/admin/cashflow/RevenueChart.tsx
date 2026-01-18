import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useRealtime } from '@/contexts/RealtimeContext';

const COLORS = {
  'Serviços': '#1e40af', // blue-800 - muito profissional
  'Produtos': '#065f46', // emerald-800 - muito profissional
  'Gorjetas': '#b45309', // amber-700 - para gorjetas
};

interface RevenueChartProps {
  startDate: string;
  endDate: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ startDate, endDate }) => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['revenue-chart'] });
  }, [refreshFinancials, queryClient]);

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['revenue-chart', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('transaction_type', 'revenue')
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) {
        console.error('Erro ao buscar dados de receitas:', error);
        throw error;
      }

      // Agrupar por categoria - MAPEAMENTO COMPLETO
      const categoryTotals: Record<string, number> = {};
      data?.forEach(transaction => {
        const category = transaction.category?.toLowerCase() || 'outros';
        let categoryLabel: string;
        
        // Mapeamento completo de categorias (inglês e português)
        if (category === 'services' || category === 'servico' || category === 'serviço') {
          categoryLabel = 'Serviços';
        } else if (category === 'products' || category === 'produto' || category === 'product') {
          categoryLabel = 'Produtos';
        } else if (category === 'tips' || category === 'gorjeta' || category === 'tip') {
          categoryLabel = 'Gorjetas';
        } else {
          // Para categorias desconhecidas, usar "Serviços" como fallback
          // já que a maioria das receitas vem de serviços
          categoryLabel = 'Serviços';
        }
        
        categoryTotals[categoryLabel] = (categoryTotals[categoryLabel] || 0) + Number(transaction.net_amount || transaction.amount || 0);
      });

      // Converter para formato do gráfico
      const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount,
      }));

      return chartData.sort((a, b) => b.value - a.value);
    }
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
        <p className="text-gray-400">Nenhuma receita encontrada no período</p>
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

export default RevenueChart;
