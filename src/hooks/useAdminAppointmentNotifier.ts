import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

/**
 * Listens for new and updated appointments and notifies the admin panel bell.
 */
export const useAdminAppointmentNotifier = () => {
  const { user } = useAuth();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    console.log('[AdminNotifier] 🔔 Escutando agendamentos para admin');

    const channel = supabase
      .channel('admin-appointments-notifier')
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

          console.log('[AdminNotifier] 📅 Novo agendamento:', appt.id);

          const details = await fetchDetails(appt);

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

          const details = await fetchDetails(appt);

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
      .subscribe();

    return () => {
      console.log('[AdminNotifier] 🔕 Removendo listener admin');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};

async function fetchDetails(appt: any) {
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
