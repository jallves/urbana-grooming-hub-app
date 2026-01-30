import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getCategoryLabel } from '@/utils/categoryMappings';

const CategoryChart: React.FC = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['category-chart'],
    queryFn: async () => {
      const currentMonth = new Date();
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // 💰 Buscar de financial_records (tabela correta do ERP)
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .in('transaction_type', ['expense', 'commission'])
        .eq('status', 'completed')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar dados de categorias:', error);
        throw error;
      }

      // Agrupar por categoria
      const categoryTotals: Record<string, number> = {};
      data?.forEach(transaction => {
        const category = transaction.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(transaction.net_amount);
      });

      // Converter para formato do gráfico com labels traduzidos
      const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: getCategoryLabel(category),
        originalCategory: category,
        value: amount,
      }));

      return chartData.sort((a, b) => b.value - a.value);
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Cores vibrantes para categorias
  const CATEGORY_COLORS: Record<string, string> = {
    'Insumos': '#ef4444',
    'Aluguel': '#f97316',
    'Utilidades': '#eab308',
    'Marketing': '#ec4899',
    'Despesas Gerais': '#6b7280',
    'Pagamento de Funcionários': '#8b5cf6',
    'Comissão': '#06b6d4',
    'Comissões': '#3b82f6',
    'Serviços': '#10b981',
    'Produtos': '#a855f7',
    'Outros': '#94a3b8',
  };

  const getColor = (categoryName: string) => {
    return CATEGORY_COLORS[categoryName] || '#6b7280';
  };

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
        <p className="text-gray-400">Nenhuma despesa encontrada este mês</p>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <defs>
          {chartData.map((entry, index) => (
            <linearGradient key={`cat-gradient-${index}`} id={`cat-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={getColor(entry.name)} stopOpacity={1} />
              <stop offset="100%" stopColor={getColor(entry.name)} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          outerRadius={90}
          innerRadius={40}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={3}
          stroke="#1f2937"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#cat-gradient-${index})`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            color: '#F3F4F6',
            padding: '12px 16px'
          }}
          formatter={(value: number) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'Valor'
          ]}
        />
        <Legend 
          verticalAlign="bottom"
          height={50}
          wrapperStyle={{ color: '#F3F4F6', paddingTop: '10px' }}
          iconType="circle"
          iconSize={10}
          formatter={(value, entry: any) => {
            const percent = ((entry.payload.value / total) * 100).toFixed(0);
            return <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{value} ({percent}%)</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryChart;
