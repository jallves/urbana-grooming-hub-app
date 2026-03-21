import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

/**
 * Comprehensive admin notifier:
 * 1. New appointments (INSERT on painel_agendamentos)
 * 2. Appointment status changes (UPDATE on painel_agendamentos)
 * 3. New sales/checkouts (INSERT on vendas)
 * 4. New subscriptions purchased (INSERT on client_subscriptions)
 * 5. Commission records (INSERT on barber_commissions)
 */
export const useAdminAppointmentNotifier = () => {
  const { user } = useAuth();
  const processedIds = useRef<Set<string>>(new Set());

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
