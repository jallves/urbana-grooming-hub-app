import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionAlert {
  id: string;
  subscription_id: string;
  client_id: string;
  client_name: string;
  plan_name: string;
  plan_price: number;
  next_billing_date: string;
  days_until: number;
  credits_used: number;
  credits_total: number;
  type: 'expiring' | 'overdue';
  last_payment_date: string | null;
  last_payment_amount: number | null;
}

export const useSubscriptionAlerts = () => {
  return useQuery({
    queryKey: ['subscription-renewal-alerts'],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);
      const sevenDaysStr = sevenDays.toISOString().split('T')[0];

      // Get active subscriptions
      const { data: subs, error } = await supabase
        .from('client_subscriptions')
        .select('id, client_id, plan_id, next_billing_date, credits_used, credits_total, status')
        .eq('status', 'active');

      if (error) throw error;
      if (!subs || subs.length === 0) return [] as SubscriptionAlert[];

      const clientIds = [...new Set(subs.map(s => s.client_id))];
      const planIds = [...new Set(subs.map(s => s.plan_id))];
      const subIds = subs.map(s => s.id);

      const [clientsRes, plansRes, paymentsRes] = await Promise.all([
        supabase.from('painel_clientes').select('id, nome').in('id', clientIds),
        supabase.from('subscription_plans').select('id, name, price').in('id', planIds),
        supabase.from('subscription_payments')
          .select('subscription_id, payment_date, amount')
          .in('subscription_id', subIds)
          .eq('status', 'paid')
          .order('payment_date', { ascending: false }),
      ]);

      const clientMap = Object.fromEntries((clientsRes.data || []).map(c => [c.id, c]));
      const planMap = Object.fromEntries((plansRes.data || []).map(p => [p.id, p]));
      
      // Get latest payment per subscription
      const latestPaymentMap: Record<string, { date: string; amount: number }> = {};
      for (const pay of (paymentsRes.data || [])) {
        if (!latestPaymentMap[pay.subscription_id]) {
          latestPaymentMap[pay.subscription_id] = { date: pay.payment_date, amount: pay.amount };
        }
      }

      const alerts: SubscriptionAlert[] = [];

      for (const sub of subs) {
        if (!sub.next_billing_date) continue;
        const client = clientMap[sub.client_id];
        const plan = planMap[sub.plan_id];
        if (!client || !plan) continue;

        const isOverdue = sub.next_billing_date < todayStr;
        const isExpiring = sub.next_billing_date >= todayStr && sub.next_billing_date <= sevenDaysStr;

        if (!isOverdue && !isExpiring) continue;

        const daysUntil = Math.ceil(
          (new Date(sub.next_billing_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const lastPay = latestPaymentMap[sub.id];

        alerts.push({
          id: sub.id,
          subscription_id: sub.id,
          client_id: sub.client_id,
          client_name: client.nome,
          plan_name: plan.name,
          plan_price: plan.price,
          next_billing_date: sub.next_billing_date,
          days_until: daysUntil,
          credits_used: sub.credits_used,
          credits_total: sub.credits_total,
          type: isOverdue ? 'overdue' : 'expiring',
          last_payment_date: lastPay?.date || null,
          last_payment_amount: lastPay?.amount || null,
        });
      }

      // Sort: overdue first, then by days_until ascending
      alerts.sort((a, b) => {
        if (a.type === 'overdue' && b.type !== 'overdue') return -1;
        if (a.type !== 'overdue' && b.type === 'overdue') return 1;
        return a.days_until - b.days_until;
      });

      return alerts;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
