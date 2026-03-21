import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { toast } from 'sonner';
import { addBarberNotification } from '@/hooks/useBarberNotifications';

const toastStyle = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid rgba(212, 175, 55, 0.5)',
  color: '#f5f5f5',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
};

/**
 * Comprehensive barber notifier:
 * 1. New appointments (INSERT)
 * 2. Appointment cancellations and status changes (UPDATE)
 * 3. Commission payments (barber_commissions changes)
 */
export const useBarberAppointmentNotifier = () => {
  const { barber } = useBarberAuth();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!barber?.id) return;

    console.log('[BarberNotifier] 🔔 Escutando notificações para barbeiro:', barber.id);

    const channel = supabase
      .channel(`barber-full-notifications-${barber.id}`)
      // New appointments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barber.id}`,
        },
        async (payload) => {
          const appt = payload.new as any;
          if (processedIds.current.has(`insert-${appt.id}`)) return;
          processedIds.current.add(`insert-${appt.id}`);

          const details = await fetchAppointmentDetails(appt);
          const description = `${details.clientName} • ${details.serviceName}\n${details.formattedDate} às ${details.formattedTime}${details.price ? ` • ${details.price}` : ''}`;

          addBarberNotification({
            title: '📅 Novo Agendamento',
            description,
            type: 'appointment',
            data: { appointmentId: appt.id },
          });

          toast('📅 Novo Agendamento!', {
            description: `${details.clientName} agendou ${details.serviceName} para ${details.formattedDate} às ${details.formattedTime}`,
            duration: 6000,
            position: 'top-center',
            style: toastStyle,
          });
        }
      )
      // Appointment status changes (cancellations, completions, etc.)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barber.id}`,
        },
        async (payload) => {
          const appt = payload.new as any;
          const old = payload.old as any;

          if (old.status === appt.status) return;

          const updateKey = `update-${appt.id}-${appt.status}`;
          if (processedIds.current.has(updateKey)) return;
          processedIds.current.add(updateKey);

          const details = await fetchAppointmentDetails(appt);

          const statusLabels: Record<string, { label: string; icon: string; type: 'appointment' | 'alert' | 'info' }> = {
            cancelado: { label: 'Cancelado', icon: '❌', type: 'alert' },
            concluido: { label: 'Concluído', icon: '✅', type: 'info' },
            confirmado: { label: 'Confirmado', icon: '✔️', type: 'info' },
            em_atendimento: { label: 'Em Atendimento', icon: '💈', type: 'info' },
            ausente: { label: 'Cliente Ausente', icon: '⚠️', type: 'alert' },
          };

          const info = statusLabels[appt.status] || { label: appt.status, icon: '📋', type: 'info' as const };

          addBarberNotification({
            title: `${info.icon} Agendamento ${info.label}`,
            description: `${details.clientName} • ${details.serviceName}\n${details.formattedDate} às ${details.formattedTime}`,
            type: info.type,
            data: { appointmentId: appt.id },
          });

          // Show toast only for cancellations (important event)
          if (appt.status === 'cancelado') {
            toast('❌ Agendamento Cancelado', {
              description: `${details.clientName} cancelou ${details.serviceName} • ${details.formattedDate} às ${details.formattedTime}`,
              duration: 6000,
              position: 'top-center',
              style: toastStyle,
            });
          }
        }
      )
      // Commission payments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'barber_commissions',
          filter: `barber_id=eq.${barber.id}`,
        },
        async (payload) => {
          const commission = payload.new as any;
          // Only notify for actual commissions (not zero-value subscription sales)
          if (!commission.valor || commission.valor <= 0) return;

          const key = `commission-${commission.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          const valor = Number(commission.valor).toFixed(2);
          const tipo = commission.tipo === 'gorjeta' ? 'Gorjeta' : 'Comissão';

          addBarberNotification({
            title: `💰 ${tipo} Recebida`,
            description: `Você recebeu R$ ${valor} de ${tipo.toLowerCase()}.`,
            type: 'info',
            data: { commissionId: commission.id },
          });

          toast(`💰 ${tipo} Recebida!`, {
            description: `R$ ${valor}`,
            duration: 5000,
            position: 'top-center',
            style: toastStyle,
          });
        }
      )
      // Commission status updates (pending -> paid)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barber_commissions',
          filter: `barber_id=eq.${barber.id}`,
        },
        async (payload) => {
          const commission = payload.new as any;
          const old = payload.old as any;

          if (old.status !== 'pending' || commission.status !== 'pago') return;
          if (!commission.valor || commission.valor <= 0) return;

          const key = `commission-paid-${commission.id}`;
          if (processedIds.current.has(key)) return;
          processedIds.current.add(key);

          const valor = Number(commission.valor).toFixed(2);

          addBarberNotification({
            title: '✅ Pagamento Confirmado',
            description: `Sua comissão de R$ ${valor} foi paga.`,
            type: 'info',
            data: { commissionId: commission.id },
          });
        }
      )
      .subscribe((status) => {
        console.log('[BarberNotifier] 📡 Status do canal:', status);
      });

    return () => {
      console.log('[BarberNotifier] 🔕 Removendo listeners');
      supabase.removeChannel(channel);
    };
  }, [barber?.id]);
};

async function fetchAppointmentDetails(appt: any) {
  let clientName = 'Cliente';
  let serviceName = 'Serviço';
  let price = '';

  try {
    const [clientRes, serviceRes] = await Promise.all([
      appt.cliente_id
        ? supabase.from('painel_clientes').select('nome').eq('id', appt.cliente_id).maybeSingle()
        : Promise.resolve({ data: null }),
      appt.servico_id
        ? supabase.from('painel_servicos').select('nome, preco').eq('id', appt.servico_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (clientRes.data) clientName = clientRes.data.nome;
    if (serviceRes.data) serviceName = serviceRes.data.nome;
    if (serviceRes.data?.preco) price = `R$ ${Number(serviceRes.data.preco).toFixed(2)}`;
  } catch {}

  const formattedDate = formatDate(appt.data);
  const formattedTime = appt.hora?.substring(0, 5) || '';

  return { clientName, serviceName, formattedDate, formattedTime, price };
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
