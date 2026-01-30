import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/utils/categoryMappings';
import { useRealtime } from '@/contexts/RealtimeContext';

// Cores vibrantes e distintas para cada categoria de despesa
const COLORS: Record<string, string> = {
  'Insumos': '#ef4444', // Vermelho vibrante
  'Aluguel': '#f97316', // Laranja vibrante
  'Utilidades': '#eab308', // Amarelo dourado
  'Marketing': '#ec4899', // Rosa vibrante
  'Despesas Gerais': '#6b7280', // Cinza neutro
  'Pagamento de Funcionários': '#8b5cf6', // Violeta vibrante
  'Comissões': '#3b82f6', // Azul vibrante
  'Gorjetas': '#f59e0b', // Âmbar/Dourado
  'Produtos': '#a855f7', // Púrpura vibrante
  'Serviços': '#06b6d4', // Ciano vibrante
  'Outros': '#94a3b8', // Cinza claro
  'Fornecedores': '#14b8a6', // Verde-água
  'Manutenção': '#22c55e', // Verde vibrante
  'Impostos': '#dc2626', // Vermelho escuro
  'Energia': '#fbbf24', // Amarelo
  'Água': '#38bdf8', // Azul claro
  'Internet': '#22d3ee', // Ciano claro
};

// Fallback de cores para categorias não mapeadas
const FALLBACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'
];

interface ExpenseChartProps {
  startDate: string;
  endDate: string;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ startDate, endDate }) => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['expense-chart'] });
  }, [refreshFinancials, queryClient]);

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
        <p className="text-gray-400">Nenhuma despesa encontrada no período</p>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Função para obter cor de uma categoria
  const getColor = (categoryName: string, index: number): string => {
    return COLORS[categoryName] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {chartData.map((entry, index) => {
            const color = getColor(entry.name, index);
            return (
              <linearGradient key={`gradient-${index}`} id={`expGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            );
          })}
        </defs>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          outerRadius="65%"
          innerRadius="30%"
          fill="#8884d8"
          dataKey="value"
          paddingAngle={3}
          stroke="#fff"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#expGradient-${index})`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '13px',
            padding: '12px 16px'
          }}
          formatter={(value: number, name: string) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            name
          ]}
        />
        <Legend 
          verticalAlign="bottom"
          height={50}
          wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
          iconType="circle"
          iconSize={10}
          formatter={(value, entry: any) => {
            const percent = ((entry.payload.value / total) * 100).toFixed(0);
            return <span style={{ color: '#374151', fontWeight: 500 }}>{value} ({percent}%)</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
