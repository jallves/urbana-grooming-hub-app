import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopBarbersChartProps {
  startDate: string;
  endDate: string;
}

const TopBarbersChart: React.FC<TopBarbersChartProps> = ({ startDate, endDate }) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['top-barbers-chart', startDate, endDate],
    queryFn: async () => {
      // Buscar receitas por barbeiro com join correto
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          net_amount,
          barber_id
        `)
        .eq('transaction_type', 'revenue')
        .eq('status', 'completed')
        .not('barber_id', 'is', null)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) {
        console.error('Erro ao buscar dados de barbeiros:', error);
        throw error;
      }

      // Buscar nomes dos barbeiros
      const barberIds = [...new Set(data?.map(t => t.barber_id))];
      const { data: barbersData } = await supabase
        .from('staff')
        .select('id, name')
        .in('id', barberIds);

      // Criar mapa de IDs para nomes
      const barberNames: Record<string, string> = {};
      barbersData?.forEach(barber => {
        barberNames[barber.id] = barber.name;
      });

      // Agrupar por barbeiro
      const barberTotals: Record<string, { name: string; revenue: number }> = {};
      
      data?.forEach(transaction => {
        const barberId = transaction.barber_id;
        const barberName = barberNames[barberId] || 'Barbeiro Desconhecido';
        
        if (!barberTotals[barberId]) {
          barberTotals[barberId] = { name: barberName, revenue: 0 };
        }
        barberTotals[barberId].revenue += Number(transaction.net_amount);
      });

      // Converter para array e ordenar
      const chartData = Object.values(barberTotals)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5) // Top 5
        .map(item => ({
          name: item.name,
          Receita: item.revenue,
        }));

      return chartData;
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
        <p className="text-gray-400">Nenhum dado encontrado no período</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6'
          }}
          formatter={(value: number) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'Receita Gerada'
          ]}
        />
        <Legend 
          wrapperStyle={{ color: '#F3F4F6' }}
        />
        <Bar dataKey="Receita" fill="#2563eb" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopBarbersChart;
