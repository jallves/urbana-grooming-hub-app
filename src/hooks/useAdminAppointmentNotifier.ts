import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

/**
 * Comprehensive admin notifier with query invalidation:
 * 1. New appointments (INSERT on painel_agendamentos)
 * 2. Appointment status changes (UPDATE on painel_agendamentos)
 * 3. New sales/checkouts (INSERT on vendas)
 * 4. New subscriptions purchased (INSERT on client_subscriptions)
 * 5. Subscription updates (UPDATE on client_subscriptions)
 * 6. Subscription payments (INSERT on subscription_payments)
 * 7. Subscription usage (INSERT on subscription_usage)
 */
export const useAdminAppointmentNotifier = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());

  const invalidateSubscriptionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-renewal-alerts'] });
  };

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const markAsProcessed = (key: string) => {
      if (processedIds.current.has(key)) return false;
      processedIds.current.add(key);
      return true;
    };

    const notifyNewAppointment = async (appt: any, options?: { silent?: boolean }) => {
      const key = `insert-${appt.id}`;
      if (!markAsProcessed(key)) return;

      const details = await fetchAppointmentDetails(appt);
      if (!isMounted) return;

      addAdminNotification({
        title: '📅 Novo Agendamento',
        description: `${details.clientName} • ${details.serviceName}\n${details.barberName} • ${details.formattedDate} às ${details.formattedTime}`,
        type: 'appointment',
        data: { appointmentId: appt.id },
      });

      if (!options?.silent) {
        toast('📅 Novo Agendamento!', {
          description: `${details.clientName} agendou ${details.serviceName} com ${details.barberName}`,
          duration: 5000,
          position: 'top-center',
        });
      }
    };

    const notifyAppointmentStatusChange = async (appt: any, old: any) => {
      if (old.status === appt.status) return;

      const updateKey = `update-${appt.id}-${appt.status}`;
      if (!markAsProcessed(updateKey)) return;

      const details = await fetchAppointmentDetails(appt);
      if (!isMounted) return;

      const statusLabels: Record<string, { label: string; icon: string }> = {
        cancelado: { label: 'Cancelado', icon: '❌' },
        concluido: { label: 'Concluído', icon: '✅' },
        confirmado: { label: 'Confirmado', icon: '✔️' },
        em_atendimento: { label: 'Em Atendimento', icon: '💈' },
        ausente: { label: 'Ausente', icon: '⚠️' },
      };

      const info = statusLabels[appt.status] || { label: appt.status, icon: '📋' };

      addAdminNotification({
        title: `${info.icon} Agendamento ${info.label}`,
        description: `${details.clientName} • ${details.serviceName}\n${details.barberName} • ${details.formattedDate} às ${details.formattedTime}`,
        type: appt.status === 'cancelado' ? 'cancel' : 'info',
        data: { appointmentId: appt.id },
      });
    };

    const notifyCheckoutCompleted = async (venda: any, options?: { silent?: boolean }) => {
      const key = `venda-${venda.id}`;
      if (!markAsProcessed(key)) return;

      const details = await fetchSaleDetails(venda);
      if (!isMounted) return;

      addAdminNotification({
        title: '💳 Checkout Concluído',
        description: `${details.clientName} • ${details.barberName}${details.valor ? `\n${details.valor}` : ''}${details.method ? ` • ${details.method}` : ''}`,
        type: 'info',
        data: { vendaId: venda.id },
      });

      if (!options?.silent) {
        toast('💳 Checkout Concluído!', {
          description: `${details.clientName} ${details.valor ? `• ${details.valor}` : ''}`,
          duration: 4000,
          position: 'top-center',
        });
      }
    };

    const notifyNewSubscription = async (sub: any, options?: { silent?: boolean }) => {
      const key = `sub-${sub.id}`;
      if (!markAsProcessed(key)) return;

      invalidateSubscriptionQueries();

      const details = await fetchSubscriptionContext(sub);
      if (!isMounted) return;

      addAdminNotification({
        title: '🎉 Nova Assinatura',
        description: `${details.clientName} adquiriu ${details.planName}\n${sub.credits_total} créditos`,
        type: 'info',
        data: { subscriptionId: sub.id },
      });

      if (!options?.silent) {
        toast('🎉 Nova Assinatura!', {
          description: `${details.clientName} • ${details.planName}`,
          duration: 5000,
          position: 'top-center',
        });
      }
    };

    const notifySubscriptionUpdate = async (sub: any, old: any) => {
      const key = `sub-update-${sub.id}-${sub.updated_at}`;
      if (!markAsProcessed(key)) return;

      invalidateSubscriptionQueries();

      if (old.status !== sub.status && sub.status === 'cancelled') {
        const details = await fetchSubscriptionContext(sub);
        if (!isMounted) return;

        addAdminNotification({
          title: '⚠️ Assinatura Cancelada',
          description: `${details.clientName} cancelou a assinatura`,
          type: 'cancel',
          data: { subscriptionId: sub.id },
        });

        toast.info('Assinatura cancelada', {
          description: details.clientName,
          duration: 4000,
        });
      }

      if (typeof old.credits_used === 'number' && typeof sub.credits_used === 'number' && sub.credits_used > old.credits_used) {
        const details = await fetchSubscriptionContext(sub);
        if (!isMounted) return;

        addAdminNotification({
          title: '💈 Crédito de Assinatura Utilizado',
          description: `${details.clientName} usou um crédito de ${details.planName}\nRestam ${details.creditsRemaining} de ${sub.credits_total}`,
          type: 'info',
          data: { subscriptionId: sub.id, usageCount: sub.credits_used },
        });

        if (details.creditsRemaining === 1) {
          addAdminNotification({
            title: '⚠️ Assinatura no Último Crédito',
            description: `${details.clientName} está com apenas 1 crédito restante em ${details.planName}`,
            type: 'alert',
            data: { subscriptionId: sub.id, warning: 'last_credit' },
          });
        }

        if (details.creditsRemaining === 0) {
          addAdminNotification({
            title: '📋 Créditos da Assinatura Esgotados',
            description: `${details.clientName} esgotou os créditos de ${details.planName}`,
            type: 'alert',
            data: { subscriptionId: sub.id, warning: 'credits_exhausted' },
          });
        }
      }
    };

    const notifySubscriptionPayment = async (pay: any) => {
      const key = `sub-pay-${pay.id}`;
      if (!markAsProcessed(key)) return;

      invalidateSubscriptionQueries();

      addAdminNotification({
        title: '💰 Pagamento de Assinatura',
        description: `R$ ${Number(pay.amount).toFixed(2)} registrado`,
        type: 'info',
        data: { paymentId: pay.id },
      });
    };

    const notifySubscriptionUsage = async (usage: any) => {
      const key = `sub-usage-${usage.id}`;
      if (!markAsProcessed(key)) return;

      invalidateSubscriptionQueries();

      const details = await fetchSubscriptionUsageContext(usage);
      if (!isMounted) return;

      addAdminNotification({
        title: '💈 Crédito de Assinatura Utilizado',
        description: details.description,
        type: 'info',
        data: { usageId: usage.id },
      });

      if (details.creditsRemaining === 1) {
        addAdminNotification({
          title: '⚠️ Assinatura no Último Crédito',
          description: `${details.clientName} está com apenas 1 crédito restante em ${details.planName}`,
          type: 'alert',
          data: { subscriptionId: usage.subscription_id, warning: 'last_credit' },
        });
      }

      if (details.creditsRemaining === 0) {
        addAdminNotification({
          title: '📋 Créditos da Assinatura Esgotados',
          description: `${details.clientName} esgotou os créditos de ${details.planName}`,
          type: 'alert',
          data: { subscriptionId: usage.subscription_id, warning: 'credits_exhausted' },
        });
      }
    };

    const hydrateRecentAdminEvents = async () => {
      const lookbackIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const [appointmentsRes, salesRes, subscriptionsRes, paymentsRes, usageRes] = await Promise.all([
        supabase
          .from('painel_agendamentos')
          .select('id, cliente_id, barbeiro_id, servico_id, data, hora, status, created_at')
          .gte('created_at', lookbackIso)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('vendas')
          .select('id, cliente_id, barbeiro_id, valor_total, forma_pagamento, created_at')
          .gte('created_at', lookbackIso)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('client_subscriptions')
          .select('id, client_id, plan_id, credits_total, credits_used, status, created_at, updated_at')
          .gte('created_at', lookbackIso)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('subscription_payments')
          .select('id, amount, created_at')
          .gte('created_at', lookbackIso)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('subscription_usage')
          .select('id, subscription_id, service_name, used_at')
          .gte('used_at', lookbackIso)
          .order('used_at', { ascending: false })
          .limit(10),
      ]);

      await Promise.all((appointmentsRes.data || []).map((appt) => notifyNewAppointment(appt, { silent: true })));
      await Promise.all((salesRes.data || []).map((sale) => notifyCheckoutCompleted(sale, { silent: true })));
      await Promise.all((subscriptionsRes.data || []).map((sub) => notifyNewSubscription(sub, { silent: true })));
      await Promise.all((paymentsRes.data || []).map((payment) => notifySubscriptionPayment(payment)));
      await Promise.all((usageRes.data || []).map((usage) => notifySubscriptionUsage(usage)));
    };

    console.log('[AdminNotifier] 🔔 Escutando notificações admin');

    const channelName = `admin-full-notifications-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      // New appointments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
        },
        async (payload) => notifyNewAppointment(payload.new as any)
      )
      // Appointment status changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos',
        },
        async (payload) => notifyAppointmentStatusChange(payload.new as any, payload.old as any)
      )
      // Checkout completions (vendas)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendas',
        },
        async (payload) => notifyCheckoutCompleted(payload.new as any)
      )
      // New subscriptions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_subscriptions',
        },
        async (payload) => notifyNewSubscription(payload.new as any)
      )
      // Subscription updates (credit usage, cancellation, etc.)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_subscriptions',
        },
        async (payload) => notifySubscriptionUpdate(payload.new as any, payload.old as any)
      )
      // Subscription payments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_payments',
        },
        async (payload) => notifySubscriptionPayment(payload.new as any)
      )
      // Subscription usage (credit consumed)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_usage',
        },
        async (payload) => notifySubscriptionUsage(payload.new as any)
      )
      .subscribe((status) => {
        console.log('[AdminNotifier] 📡 Status do canal:', status);

        if (status === 'SUBSCRIBED') {
          hydrateRecentAdminEvents().catch((error) => {
            console.error('[AdminNotifier] ❌ Erro ao reconciliar eventos recentes:', error);
          });
        }
      });

    return () => {
      isMounted = false;
      console.log('[AdminNotifier] 🔕 Removendo listeners admin');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};

async function fetchAppointmentDetails(appt: any) {
  let clientName = 'Cliente';
  let barberName = 'Barbeiro';
  let serviceName = 'Serviço';

  try {
    const [clientRes, barberRes, serviceRes] = await Promise.all([
      appt.cliente_id
        ? supabase.from('painel_clientes').select('nome').eq('id', appt.cliente_id).maybeSingle()
        : Promise.resolve({ data: null }),
      appt.barbeiro_id
        ? supabase.from('painel_barbeiros').select('nome').eq('id', appt.barbeiro_id).maybeSingle()
        : Promise.resolve({ data: null }),
      appt.servico_id
        ? supabase.from('painel_servicos').select('nome').eq('id', appt.servico_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (clientRes.data) clientName = clientRes.data.nome;
    if (barberRes.data) barberName = barberRes.data.nome;
    if (serviceRes.data) serviceName = serviceRes.data.nome;
  } catch {}

  const formattedDate = formatDate(appt.data);
  const formattedTime = appt.hora?.substring(0, 5) || '';

  return { clientName, barberName, serviceName, formattedDate, formattedTime };
}

async function fetchSaleDetails(venda: any) {
  let clientName = 'Cliente';
  let barberName = 'Barbeiro';

  try {
    const [clientRes, barberRes] = await Promise.all([
      venda.cliente_id
        ? supabase.from('painel_clientes').select('nome').eq('id', venda.cliente_id).maybeSingle()
        : Promise.resolve({ data: null }),
      venda.barbeiro_id
        ? supabase.from('painel_barbeiros').select('nome').eq('id', venda.barbeiro_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (clientRes?.data) clientName = clientRes.data.nome;
    if (barberRes?.data) barberName = barberRes.data.nome;
  } catch {}

  return {
    clientName,
    barberName,
    valor: venda.valor_total ? `R$ ${Number(venda.valor_total).toFixed(2)}` : '',
    method: venda.forma_pagamento || '',
  };
}

async function fetchSubscriptionContext(sub: any) {
  let clientName = 'Cliente';
  let planName = 'Plano';

  try {
    const [clientRes, planRes] = await Promise.all([
      sub.client_id
        ? supabase.from('painel_clientes').select('nome').eq('id', sub.client_id).maybeSingle()
        : Promise.resolve({ data: null }),
      sub.plan_id
        ? supabase.from('subscription_plans').select('name, price').eq('id', sub.plan_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (clientRes?.data) clientName = clientRes.data.nome;
    if (planRes?.data) planName = `${planRes.data.name} (R$ ${Number(planRes.data.price).toFixed(2)})`;
  } catch {}

  return {
    clientName,
    planName,
    creditsRemaining: Math.max(0, Number(sub.credits_total || 0) - Number(sub.credits_used || 0)),
  };
}

async function fetchSubscriptionUsageContext(usage: any) {
  let clientName = 'Cliente';
  let planName = 'Plano';
  let creditsRemaining: number | null = null;

  try {
    const { data: subscription } = await supabase
      .from('client_subscriptions')
      .select('id, client_id, plan_id, credits_total, credits_used')
      .eq('id', usage.subscription_id)
      .maybeSingle();

    if (subscription) {
      const details = await fetchSubscriptionContext(subscription);
      clientName = details.clientName;
      planName = details.planName;
      creditsRemaining = details.creditsRemaining;
    }
  } catch {}

  return {
    clientName,
    planName,
    creditsRemaining,
    description: usage.service_name
      ? `${clientName} utilizou crédito em ${usage.service_name}${creditsRemaining !== null ? `\nRestam ${creditsRemaining} créditos em ${planName}` : ''}`
      : `${clientName} consumiu um crédito${creditsRemaining !== null ? `\nRestam ${creditsRemaining} créditos em ${planName}` : ''}`,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
