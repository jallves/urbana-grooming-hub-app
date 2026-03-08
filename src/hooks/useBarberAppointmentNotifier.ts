import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { toast } from 'sonner';

/**
 * Hook that listens to new appointments for the logged-in barber
 * and shows an in-app toast notification with appointment details.
 * Should be mounted once in BarberLayout.
 */
export const useBarberAppointmentNotifier = () => {
  const { barber } = useBarberAuth();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!barber?.id) return;

    console.log('[BarberNotifier] 🔔 Escutando agendamentos para barbeiro:', barber.id);

    const channel = supabase
      .channel(`barber-appointments-${barber.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barber.id}`,
        },
        async (payload) => {
          const newAppointment = payload.new as any;
          
          // Avoid duplicate notifications
          if (processedIds.current.has(newAppointment.id)) return;
          processedIds.current.add(newAppointment.id);

          console.log('[BarberNotifier] 📅 Novo agendamento recebido:', newAppointment);

          // Fetch client and service names
          let clientName = 'Cliente';
          let serviceName = 'Serviço';

          try {
            const [clientRes, serviceRes] = await Promise.all([
              newAppointment.cliente_id
                ? supabase.from('painel_clientes').select('nome').eq('id', newAppointment.cliente_id).maybeSingle()
                : Promise.resolve({ data: null }),
              newAppointment.servico_id
                ? supabase.from('painel_servicos').select('nome, preco').eq('id', newAppointment.servico_id).maybeSingle()
                : Promise.resolve({ data: null }),
            ]);

            if (clientRes.data) clientName = clientRes.data.nome;
            if (serviceRes.data) {
              serviceName = serviceRes.data.nome;
            }

            const formattedDate = formatDate(newAppointment.data);
            const formattedTime = newAppointment.hora?.substring(0, 5) || '';
            const price = serviceRes.data?.preco 
              ? `R$ ${Number(serviceRes.data.preco).toFixed(2)}` 
              : '';

            toast.success('📅 Novo Agendamento!', {
              description: `${clientName} agendou ${serviceName} para ${formattedDate} às ${formattedTime}${price ? ` • ${price}` : ''}`,
              duration: 8000,
              position: 'top-center',
              style: {
                background: '#1a1a2e',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#f5f5f5',
              },
            });
          } catch (err) {
            console.error('[BarberNotifier] Erro ao buscar detalhes:', err);
            toast.success('📅 Novo Agendamento!', {
              description: `Você recebeu um novo agendamento para ${newAppointment.data} às ${newAppointment.hora?.substring(0, 5)}`,
              duration: 8000,
              position: 'top-center',
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[BarberNotifier] 🔕 Removendo listener de agendamentos');
      supabase.removeChannel(channel);
    };
  }, [barber?.id]);
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
