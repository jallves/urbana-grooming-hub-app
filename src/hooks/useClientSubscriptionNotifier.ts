import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { addClientNotification } from '@/hooks/useClientNotifications';
import { toast } from 'sonner';

const toastStyle = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid rgba(212, 175, 55, 0.5)',
  color: '#f5f5f5',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
};

/**
 * Comprehensive subscription notifier:
 * 1. On mount: checks billing dates, overdue, low credits
 * 2. Realtime: listens for new subscriptions (purchase), credit usage updates
 */
export const useClientSubscriptionNotifier = () => {
  const { cliente } = usePainelClienteAuth();
  const checkedRef = useRef(false);
  const processedIds = useRef<Set<string>>(new Set());

  // One-time alerts on mount
  useEffect(() => {
    if (!cliente?.id || checkedRef.current) return;
    checkedRef.current = true;
    checkSubscriptionAlerts(cliente.id);
  }, [cliente?.id]);

  // Realtime listener for subscription changes
  useEffect(() => {
    if (!cliente?.id) return;

    const channel = supabase
      .channel(`client-subscriptions-${cliente.id}`)
      // New subscription purchased
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_subscriptions',
          filter: `client_id=eq.${cliente.id}`,
        },
        async (payload) => {
          const sub = payload.new as any;
          const key = `sub-insert-${sub.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          const planName = await getPlanName(sub.plan_id);

          addClientNotification({
            title: '🎉 Plano Ativado!',
            description: `Seu plano ${planName} foi ativado com sucesso! Você tem ${sub.credits_total} créditos disponíveis.`,
            type: 'subscription',
            data: { subscriptionId: sub.id, type: 'purchase' },
          });

          toast('🎉 Plano Ativado!', {
            description: `${planName} • ${sub.credits_total} créditos disponíveis`,
            duration: 6000,
            position: 'top-center',
            style: toastStyle,
          });
        }
      )
      // Credit usage / subscription updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_subscriptions',
          filter: `client_id=eq.${cliente.id}`,
        },
        async (payload) => {
          const sub = payload.new as any;
          const old = payload.old as any;

          // Credits used changed
          if (old.credits_used !== sub.credits_used && sub.credits_used > old.credits_used) {
            const key = `sub-credit-${sub.id}-${sub.credits_used}`;
            if (processedIds.current.has(key)) return;
            processedIds.current.add(key);

            const planName = await getPlanName(sub.plan_id);
            const remaining = sub.credits_total - sub.credits_used;

            addClientNotification({
              title: '💈 Crédito Utilizado',
              description: `Você usou 1 crédito do plano ${planName}. Restam ${remaining} de ${sub.credits_total} créditos.`,
              type: 'subscription',
              data: { subscriptionId: sub.id, type: 'credit_used' },
            });

            // Last credit warning
            if (remaining === 1) {
              addClientNotification({
                title: '⚠️ Último Crédito!',
                description: `Atenção! Você tem apenas 1 crédito restante no plano ${planName}. Considere renovar.`,
                type: 'subscription',
                data: { subscriptionId: sub.id, type: 'last_credit' },
              });

              toast('⚠️ Último Crédito!', {
                description: `Apenas 1 crédito restante no ${planName}`,
                duration: 8000,
                position: 'top-center',
                style: toastStyle,
              });
            }

            // All credits used
            if (remaining === 0) {
              addClientNotification({
                title: '📋 Créditos Esgotados',
                description: `Todos os créditos do plano ${planName} foram utilizados. Aguarde a renovação ou adquira um novo plano.`,
                type: 'subscription',
                data: { subscriptionId: sub.id, type: 'credits_exhausted' },
              });

              toast('📋 Créditos Esgotados', {
                description: `Todos os créditos do ${planName} foram usados`,
                duration: 8000,
                position: 'top-center',
                style: toastStyle,
              });
            }
          }

          // Status changed (cancelled, expired, etc.)
          if (old.status !== sub.status) {
            const key = `sub-status-${sub.id}-${sub.status}`;
            if (processedIds.current.has(key)) return;
            processedIds.current.add(key);

            const planName = await getPlanName(sub.plan_id);

            const statusMessages: Record<string, { title: string; desc: string }> = {
              cancelled: {
                title: '❌ Assinatura Cancelada',
                desc: `Seu plano ${planName} foi cancelado.`,
              },
              expired: {
                title: '⏰ Assinatura Expirada',
                desc: `Seu plano ${planName} expirou. Renove para continuar usando os serviços.`,
              },
            };

            const msg = statusMessages[sub.status];
            if (msg) {
              addClientNotification({
                title: msg.title,
                description: msg.desc,
                type: 'subscription',
                data: { subscriptionId: sub.id, type: 'status_change' },
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente?.id]);

  async function checkSubscriptionAlerts(clientId: string) {
    try {
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
        const plan = planMap[sub.plan_id];
        if (!plan) continue;
        const creditsRemaining = sub.credits_total - sub.credits_used;

        // Upcoming renewal (within 7 days)
        if (sub.next_billing_date && sub.next_billing_date >= todayStr && sub.next_billing_date <= sevenDaysStr) {
          const daysUntil = Math.ceil(
            (new Date(sub.next_billing_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
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
        if (sub.next_billing_date && sub.next_billing_date < todayStr) {
          addClientNotification({
            title: '⚠️ Assinatura vencida',
            description: `Seu plano ${plan.name} está vencido desde ${formatDateBR(sub.next_billing_date)}. Renove para continuar usando seus créditos.`,
            type: 'update',
            data: { subscriptionId: sub.id, type: 'overdue' },
          });
        }

        // Low credits warning (mount-time)
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

async function getPlanName(planId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', planId)
      .maybeSingle();
    return data?.name || 'Assinatura';
  } catch {
    return 'Assinatura';
  }
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
