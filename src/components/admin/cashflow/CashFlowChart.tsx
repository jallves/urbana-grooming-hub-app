
import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtime } from '@/contexts/RealtimeContext';

const CashFlowChart: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['cash-flow-chart'] });
  }, [refreshFinancials, queryClient]);

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['cash-flow-chart'],
    queryFn: async () => {
      const months = [];
      
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        // 💰 Buscar de financial_records (tabela correta do ERP)
        const { data, error } = await supabase
          .from('financial_records')
          .select('*')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        if (error) {
          console.error('Erro ao buscar dados do gráfico:', error);
          throw error;
        }

        // Receitas = revenue completed
        const income = data?.filter(t => 
          t.transaction_type === 'revenue' && t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;
        
        // Despesas = expense + commission completed
        const expense = data?.filter(t => 
          (t.transaction_type === 'expense' || t.transaction_type === 'commission') && 
          t.status === 'completed'
        ).reduce((sum, t) => sum + Number(t.net_amount), 0) || 0;

        months.push({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          receitas: income,
          despesas: expense,
          liquido: income - expense,
        });
      }

      return months;
    }
  });

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          stroke="#6b7280"
          fontSize={10}
          tick={{ fontSize: 10 }}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={10}
          tick={{ fontSize: 10 }}
          width={50}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '11px'
          }}
          formatter={(value: number, name: string) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Líquido'
          ]}
        />
        <Legend 
          wrapperStyle={{ fontSize: '11px' }}
          iconSize={10}
        />
        <Line 
          type="monotone" 
          dataKey="receitas" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Receitas"
          dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="despesas" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Despesas"
          dot={{ fill: '#EF4444', strokeWidth: 1, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="liquido" 
          stroke="#F59E0B" 
          strokeWidth={2}
          name="Líquido"
          dot={{ fill: '#F59E0B', strokeWidth: 1, r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CashFlowChart;
