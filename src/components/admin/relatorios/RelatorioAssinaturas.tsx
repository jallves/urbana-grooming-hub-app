import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Crown, TrendingUp, UserPlus, UserMinus, CreditCard, Star } from 'lucide-react';

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
      const totalSubs = ativas + canceladas;

      const receitaTotal = payments.data?.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0) || 0;
      const creditosUsados = usage.data?.length || 0;

      const mrr = subs.data?.filter(s => s.status === 'active').reduce((s, sub) => {
        const plan = planMap[sub.plan_id];
        return s + (plan?.price || 0);
      }, 0) || 0;

      const byPlan: Record<string, { name: string; count: number; receita: number }> = {};
      subs.data?.filter(s => s.status === 'active').forEach(s => {
        const plan = planMap[s.plan_id];
        if (!plan) return;
        if (!byPlan[s.plan_id]) byPlan[s.plan_id] = { name: plan.name, count: 0, receita: 0 };
        byPlan[s.plan_id].count += 1;
        byPlan[s.plan_id].receita += plan.price;
      });

      return { ativas, canceladas, novasNoMes, receitaTotal, creditosUsados, mrr, totalSubs, byPlan: Object.values(byPlan).sort((a, b) => b.count - a.count) };
    }
  });

  if (isLoading) return <Loading />;

  const totalPlanSubs = data?.byPlan.reduce((s, p) => s + p.count, 0) || 0;

  const cards = [
    { label: 'Ativas', value: String(data?.ativas || 0), icon: Crown, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', pct: data?.totalSubs ? ((data.ativas / data.totalSubs) * 100).toFixed(1) + '%' : '-' },
    { label: 'Novas no Mês', value: String(data?.novasNoMes || 0), icon: UserPlus, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', pct: null },
    { label: 'Canceladas', value: String(data?.canceladas || 0), icon: UserMinus, color: 'text-red-600', bg: 'bg-red-50 border-red-200', pct: data?.totalSubs ? ((data.canceladas / data.totalSubs) * 100).toFixed(1) + '%' : '-' },
    { label: 'MRR', value: `R$ ${(data?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', pct: null },
    { label: 'Receita do Mês', value: `R$ ${(data?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', pct: null },
    { label: 'Créditos Usados', value: String(data?.creditosUsados || 0), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', pct: null },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className={`border ${c.bg}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                <p className={`text-[10px] font-medium ${c.color}`}>{c.label}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                {c.pct && <span className="text-[10px] text-gray-400">{c.pct}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.byPlan?.length || 0) > 0 && (
        <Card className="bg-white border-purple-200">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.byPlan.map((p, i) => {
              const pct = totalPlanSubs > 0 ? (p.count / totalPlanSubs) * 100 : 0;
              return (
                <div key={i} className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.count} assinante{p.count !== 1 ? 's' : ''} <span className="text-purple-500">({pct.toFixed(1)}%)</span></p>
                    </div>
                    <p className="text-sm font-bold text-purple-700">R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                  </div>
                  <div className="w-full bg-purple-200/50 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function Loading() { return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" /></div>; }

export default RelatorioAssinaturas;
