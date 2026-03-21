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

    console.log('[AdminNotifier] 🔔 Escutando notificações admin');

    const channel = supabase
      .channel('admin-full-notifications')
      // New appointments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
        },
        async (payload) => {
          const appt = payload.new as any;
          if (processedIds.current.has(`insert-${appt.id}`)) return;
          processedIds.current.add(`insert-${appt.id}`);

          const details = await fetchAppointmentDetails(appt);

          addAdminNotification({
            title: '📅 Novo Agendamento',
            description: `${details.clientName} • ${details.serviceName}\n${details.barberName} • ${details.formattedDate} às ${details.formattedTime}`,
            type: 'appointment',
            data: { appointmentId: appt.id },
          });

          toast('📅 Novo Agendamento!', {
            description: `${details.clientName} agendou ${details.serviceName} com ${details.barberName}`,
            duration: 5000,
            position: 'top-center',
          });
        }
      )
      // Appointment status changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos',
        },
        async (payload) => {
          const appt = payload.new as any;
          const old = payload.old as any;

          if (old.status === appt.status) return;

          const updateKey = `update-${appt.id}-${appt.status}`;
          if (processedIds.current.has(updateKey)) return;
          processedIds.current.add(updateKey);

          const details = await fetchAppointmentDetails(appt);

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
        }
      )
      // Checkout completions (vendas)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendas',
        },
        async (payload) => {
          const venda = payload.new as any;
          const key = `venda-${venda.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

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

          const valor = venda.valor_total ? `R$ ${Number(venda.valor_total).toFixed(2)}` : '';
          const method = venda.forma_pagamento || '';

          addAdminNotification({
            title: '💳 Checkout Concluído',
            description: `${clientName} • ${barberName}${valor ? `\n${valor}` : ''}${method ? ` • ${method}` : ''}`,
            type: 'info',
            data: { vendaId: venda.id },
          });

          toast('💳 Checkout Concluído!', {
            description: `${clientName} ${valor ? `• ${valor}` : ''}`,
            duration: 4000,
            position: 'top-center',
          });
        }
      )
      // New subscriptions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_subscriptions',
        },
        async (payload) => {
          const sub = payload.new as any;
          const key = `sub-${sub.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          invalidateSubscriptionQueries();

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

          addAdminNotification({
            title: '🎉 Nova Assinatura',
            description: `${clientName} adquiriu ${planName}\n${sub.credits_total} créditos`,
            type: 'info',
            data: { subscriptionId: sub.id },
          });

          toast('🎉 Nova Assinatura!', {
            description: `${clientName} • ${planName}`,
            duration: 5000,
            position: 'top-center',
          });
        }
      )
      // Subscription updates (credit usage, cancellation, etc.)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_subscriptions',
        },
        async (payload) => {
          const sub = payload.new as any;
          const old = payload.old as any;
          const key = `sub-update-${sub.id}-${sub.updated_at}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          invalidateSubscriptionQueries();

          if (old.status !== sub.status && sub.status === 'cancelled') {
            let clientName = 'Cliente';
            try {
              const { data } = await supabase.from('painel_clientes').select('nome').eq('id', sub.client_id).maybeSingle();
              if (data) clientName = data.nome;
            } catch {}

            addAdminNotification({
              title: '⚠️ Assinatura Cancelada',
              description: `${clientName} cancelou a assinatura`,
              type: 'cancel',
              data: { subscriptionId: sub.id },
            });

            toast.info('Assinatura cancelada', {
              description: clientName,
              duration: 4000,
            });
          }
        }
      )
      // Subscription payments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_payments',
        },
        async (payload) => {
          const pay = payload.new as any;
          const key = `sub-pay-${pay.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          invalidateSubscriptionQueries();

          addAdminNotification({
            title: '💰 Pagamento de Assinatura',
            description: `R$ ${Number(pay.amount).toFixed(2)} registrado`,
            type: 'info',
            data: { paymentId: pay.id },
          });
        }
      )
      // Subscription usage (credit consumed)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_usage',
        },
        async (payload) => {
          const usage = payload.new as any;
          const key = `sub-usage-${usage.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          invalidateSubscriptionQueries();

          addAdminNotification({
            title: '💈 Crédito de Assinatura Utilizado',
            description: usage.service_name ? `Serviço: ${usage.service_name}` : 'Crédito consumido',
            type: 'info',
            data: { usageId: usage.id },
          });
        }
      )
      .subscribe();

    return () => {
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
