import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const isStatusRecebido = (status: string | null) =>
  status === 'recebido' || status === 'pago';

const FinancialEvolutionChart: React.FC = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['financial-evolution-chart'],
    queryFn: async () => {
      const now = new Date();
      const months = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

        const [crResult, cpResult] = await Promise.all([
          supabase.from('contas_receber').select('valor, status')
            .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
          supabase.from('contas_pagar').select('valor, status, categoria')
            .gte('data_vencimento', firstDay).lte('data_vencimento', lastDay),
        ]);

        const cr = crResult.data || [];
        const cp = cpResult.data || [];

        const revenue = cr.filter(r => isStatusRecebido(r.status)).reduce((s, r) => s + Number(r.valor), 0);
        const paidCp = cp.filter(r => isStatusRecebido(r.status));
        const commissions = paidCp.filter(r => r.categoria === 'Comissão').reduce((s, r) => s + Number(r.valor), 0);
        const expenses = paidCp.filter(r => r.categoria !== 'Comissão').reduce((s, r) => s + Number(r.valor), 0);
        const profit = revenue - expenses - commissions;

        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
          receita: revenue,
          despesas: expenses,
          comissoes: commissions,
          lucro: profit,
        });
      }

      return months;
    },
    refetchInterval: 300000,
  });

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          📈 Evolução Financeira (Últimos 6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
              contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px', padding: '12px 16px' }}
              labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" iconSize={10} />
            <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} name="Receita" dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} name="Despesas" dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="comissoes" stroke="#a855f7" strokeWidth={3} name="Comissões" dot={{ fill: '#a855f7', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={4} name="Lucro Líquido" dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialEvolutionChart;
