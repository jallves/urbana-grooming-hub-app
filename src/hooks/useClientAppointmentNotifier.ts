import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { toast } from 'sonner';
import { addClientNotification } from '@/hooks/useClientNotifications';

/**
 * Listens for:
 * 1. New appointments (INSERT) for the logged-in client
 * 2. Status changes (UPDATE) on existing appointments
 * 3. Upcoming appointment reminders (checked on mount)
 */
export const useClientAppointmentNotifier = () => {
  const { cliente } = usePainelClienteAuth();
  const processedIds = useRef<Set<string>>(new Set());
  const reminderChecked = useRef(false);

  // Check for upcoming appointments on mount (reminder)
  useEffect(() => {
    if (!cliente?.id || reminderChecked.current) return;
    reminderChecked.current = true;

    checkUpcomingReminders(cliente.id);
  }, [cliente?.id]);

  // Realtime listener for inserts and updates
  useEffect(() => {
    if (!cliente?.id) return;

    console.log('[ClientNotifier] 🔔 Escutando agendamentos para cliente:', cliente.id);

    const channel = supabase
      .channel(`client-appointments-${cliente.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `cliente_id=eq.${cliente.id}`,
        },
        async (payload) => {
          const appt = payload.new as any;
          if (processedIds.current.has(`insert-${appt.id}`)) return;
          processedIds.current.add(`insert-${appt.id}`);

          const details = await fetchAppointmentDetails(appt);

          addClientNotification({
            title: '✅ Agendamento Confirmado',
            description: `${details.serviceName} com ${details.barberName}\n${details.formattedDate} às ${details.formattedTime}`,
            type: 'appointment',
            data: { appointmentId: appt.id },
          });

          toast('✅ Agendamento Confirmado!', {
            description: `${details.serviceName} com ${details.barberName} • ${details.formattedDate} às ${details.formattedTime}`,
            duration: 6000,
            position: 'top-center',
            style: toastStyle,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `cliente_id=eq.${cliente.id}`,
        },
        async (payload) => {
          const appt = payload.new as any;
          const old = payload.old as any;

          // Only notify on status changes
          if (old.status === appt.status) return;
          if (processedIds.current.has(`update-${appt.id}-${appt.status}`)) return;
          processedIds.current.add(`update-${appt.id}-${appt.status}`);

          const details = await fetchAppointmentDetails(appt);
          const statusLabels: Record<string, { label: string; icon: string; type: 'update' | 'cancel' }> = {
            confirmado: { label: 'Confirmado', icon: '✅', type: 'update' },
            cancelado: { label: 'Cancelado', icon: '❌', type: 'cancel' },
            concluido: { label: 'Concluído', icon: '🎉', type: 'update' },
            ausente: { label: 'Marcado como Ausente', icon: '⚠️', type: 'update' },
            em_atendimento: { label: 'Em Atendimento', icon: '💈', type: 'update' },
          };

          const info = statusLabels[appt.status] || { label: appt.status, icon: '📋', type: 'update' as const };

          addClientNotification({
            title: `${info.icon} Agendamento ${info.label}`,
            description: `${details.serviceName} • ${details.formattedDate} às ${details.formattedTime}`,
            type: info.type,
            data: { appointmentId: appt.id },
          });

          toast(`${info.icon} Agendamento ${info.label}`, {
            description: `${details.serviceName} • ${details.formattedDate} às ${details.formattedTime}`,
            duration: 5000,
            position: 'top-center',
            style: toastStyle,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente?.id]);
};

async function checkUpcomingReminders(clienteId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('painel_agendamentos')
      .select('id, data, hora, servico_id, barbeiro_id, status')
      .eq('cliente_id', clienteId)
      .gte('data', today)
      .in('status', ['agendado', 'confirmado'])
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .limit(3);

    if (!data?.length) return;

    for (const appt of data) {
      const details = await fetchAppointmentDetails(appt);
      const isToday = appt.data === today;

      addClientNotification({
        title: isToday ? '⏰ Agendamento Hoje!' : '📅 Próximo Agendamento',
        description: `${details.serviceName} com ${details.barberName}\n${details.formattedDate} às ${details.formattedTime}`,
        type: 'reminder',
        data: { appointmentId: appt.id },
      });
    }
  } catch (err) {
    console.error('[ClientNotifier] Erro ao buscar lembretes:', err);
  }
}

async function fetchAppointmentDetails(appt: any) {
  let barberName = 'Barbeiro';
  let serviceName = 'Serviço';

  try {
    const [barberRes, serviceRes] = await Promise.all([
      appt.barbeiro_id
        ? supabase.from('painel_barbeiros').select('nome').eq('id', appt.barbeiro_id).maybeSingle()
        : Promise.resolve({ data: null }),
      appt.servico_id
        ? supabase.from('painel_servicos').select('nome').eq('id', appt.servico_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (barberRes.data) barberName = barberRes.data.nome;
    if (serviceRes.data) serviceName = serviceRes.data.nome;
  } catch {}

  const formattedDate = formatDate(appt.data);
  const formattedTime = appt.hora?.substring(0, 5) || '';

  return { barberName, serviceName, formattedDate, formattedTime };
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

const toastStyle = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid rgba(212, 175, 55, 0.5)',
  color: '#f5f5f5',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
};
