import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useRealtime } from '@/contexts/RealtimeContext';

interface TopBarbersChartProps {
  startDate: string;
  endDate: string;
}

// Paleta de cores vibrantes para cada barbeiro
const BARBER_COLORS = [
  '#1e40af', // Azul escuro (1º lugar)
  '#059669', // Verde esmeralda (2º lugar)
  '#d97706', // Âmbar (3º lugar)
  '#7c3aed', // Violeta (4º lugar)
  '#dc2626', // Vermelho (5º lugar)
];

const TopBarbersChart: React.FC<TopBarbersChartProps> = ({ startDate, endDate }) => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['top-barbers-chart'] });
  }, [refreshFinancials, queryClient]);

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

      // Buscar nomes dos barbeiros (tentar painel_barbeiros primeiro, fallback para staff)
      const barberIds = [...new Set(data?.map(t => t.barber_id).filter(Boolean))];
      
      // Primeiro tentar painel_barbeiros
      const { data: barbersData } = await supabase
        .from('painel_barbeiros')
        .select('id, nome')
        .in('id', barberIds);

      // Criar mapa de IDs para nomes
      const barberNames: Record<string, string> = {};
      barbersData?.forEach(barber => {
        barberNames[barber.id] = barber.nome;
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
        .map((item, index) => ({
          name: item.name,
          Receita: item.revenue,
          fill: BARBER_COLORS[index % BARBER_COLORS.length],
        }));

      return chartData;
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
        <p className="text-gray-400">Nenhum dado encontrado no período</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          width={50}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: number) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'Receita Gerada'
          ]}
        />
        <Legend 
          wrapperStyle={{ fontSize: '11px' }}
          iconSize={10}
        />
        <Bar dataKey="Receita" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopBarbersChart;
