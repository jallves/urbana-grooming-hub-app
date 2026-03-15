import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { addClientNotification } from '@/hooks/useClientNotifications';

/**
 * Checks for subscription renewal notifications for the logged-in client.
 * Reads from the `notifications` table for subscription_renewal type.
 * Also checks locally for upcoming billing dates.
 */
export const useClientSubscriptionNotifier = () => {
  const { cliente } = usePainelClienteAuth();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!cliente?.id || checkedRef.current) return;
    checkedRef.current = true;

    checkSubscriptionAlerts(cliente.id);
  }, [cliente?.id]);

  async function checkSubscriptionAlerts(clientId: string) {
    try {
      // Check active subscriptions with upcoming billing
      const { data: subs } = await supabase
        .from('client_subscriptions')
        .select('id, plan_id, next_billing_date, credits_used, credits_total, status')
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (!subs || subs.length === 0) return;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);
      const sevenDaysStr = sevenDays.toISOString().split('T')[0];

      const planIds = [...new Set(subs.map(s => s.plan_id))];
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name, price')
        .in('id', planIds);

      const planMap = Object.fromEntries((plans || []).map(p => [p.id, p]));

      for (const sub of subs) {
        if (!sub.next_billing_date) continue;
        const plan = planMap[sub.plan_id];
        if (!plan) continue;

        const billingDate = sub.next_billing_date;
        const creditsRemaining = sub.credits_total - sub.credits_used;

        // Upcoming renewal (within 7 days)
        if (billingDate >= todayStr && billingDate <= sevenDaysStr) {
          const daysUntil = Math.ceil(
            (new Date(billingDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysText = daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dias`;

          addClientNotification({
            title: `🔔 Assinatura vence ${daysText}`,
            description: `Seu plano ${plan.name} (R$ ${plan.price.toFixed(2)}) vence ${daysText}. Créditos restantes: ${creditsRemaining}/${sub.credits_total}.`,
            type: 'reminder',
            data: { subscriptionId: sub.id, type: 'renewal' },
          });
        }

        // Overdue
        if (billingDate < todayStr) {
          addClientNotification({
            title: '⚠️ Assinatura vencida',
            description: `Seu plano ${plan.name} está vencido desde ${formatDateBR(billingDate)}. Renove para continuar usando seus créditos.`,
            type: 'update',
            data: { subscriptionId: sub.id, type: 'overdue' },
          });
        }

        // Low credits warning
        if (creditsRemaining === 1) {
          addClientNotification({
            title: '📋 Último crédito disponível',
            description: `Você tem apenas 1 crédito restante no plano ${plan.name}.`,
            type: 'reminder',
            data: { subscriptionId: sub.id, type: 'low_credits' },
          });
        }
      }
    } catch (error) {
      console.error('[SubscriptionNotifier] Error checking alerts:', error);
    }
  }
};

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
