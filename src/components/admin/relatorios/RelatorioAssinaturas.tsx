import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props { filters: { mes: number; ano: number } }

const RelatorioAssinaturas: React.FC<Props> = ({ filters }) => {
  const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`;
  const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-assinaturas', filters],
    queryFn: async () => {
      const [subs, plans, payments, usage] = await Promise.all([
        supabase.from('client_subscriptions').select('id, client_id, plan_id, status, credits_used, credits_total, start_date, created_at'),
        supabase.from('subscription_plans').select('id, name, price, credits_total'),
        supabase.from('subscription_payments').select('amount, status, payment_date, subscription_id').gte('payment_date', startDate).lte('payment_date', endDate),
        supabase.from('subscription_usage').select('subscription_id, used_at').gte('used_at', `${startDate}T00:00:00`).lte('used_at', `${endDate}T23:59:59`),
      ]);

      const planMap: Record<string, { name: string; price: number; credits: number }> = {};
      plans.data?.forEach(p => { planMap[p.id] = { name: p.name, price: Number(p.price), credits: p.credits_total }; });

      const ativas = subs.data?.filter(s => s.status === 'active').length || 0;
      const canceladas = subs.data?.filter(s => s.status === 'cancelled').length || 0;
      const novasNoMes = subs.data?.filter(s => s.created_at >= `${startDate}T00:00:00` && s.created_at <= `${endDate}T23:59:59`).length || 0;

      const receitaTotal = payments.data?.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0) || 0;
      const creditosUsados = usage.data?.length || 0;

      // MRR
      const mrr = subs.data?.filter(s => s.status === 'active').reduce((s, sub) => {
        const plan = planMap[sub.plan_id];
        return s + (plan?.price || 0);
      }, 0) || 0;

      // By plan
      const byPlan: Record<string, { name: string; count: number; receita: number }> = {};
      subs.data?.filter(s => s.status === 'active').forEach(s => {
        const plan = planMap[s.plan_id];
        if (!plan) return;
        if (!byPlan[s.plan_id]) byPlan[s.plan_id] = { name: plan.name, count: 0, receita: 0 };
        byPlan[s.plan_id].count += 1;
        byPlan[s.plan_id].receita += plan.price;
      });

      return { ativas, canceladas, novasNoMes, receitaTotal, creditosUsados, mrr, byPlan: Object.values(byPlan).sort((a, b) => b.count - a.count) };
    }
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Assinaturas Ativas', value: String(data?.ativas || 0), color: 'text-emerald-700' },
          { label: 'Novas no Mês', value: String(data?.novasNoMes || 0), color: 'text-blue-700' },
          { label: 'Canceladas', value: String(data?.canceladas || 0), color: 'text-red-600' },
          { label: 'MRR', value: `R$ ${(data?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-purple-700' },
          { label: 'Receita do Mês', value: `R$ ${(data?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-emerald-700' },
          { label: 'Créditos Usados', value: String(data?.creditosUsados || 0), color: 'text-amber-600' },
        ].map((m, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-3">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.byPlan?.length || 0) > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-3 sm:p-4 pb-2"><CardTitle className="text-sm">Distribuição por Plano</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byPlan.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.count} assinante{p.count !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" /></div>; }

export default RelatorioAssinaturas;
