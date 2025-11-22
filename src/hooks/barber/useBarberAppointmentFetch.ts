
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  created_at: string;
  updated_at: string;
  painel_clientes: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface AppointmentWithDetails {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_name: string;
  service_name: string;
  service?: {
    price?: number;
  };
  data: string;
  hora: string;
}

export const useBarberAppointmentFetch = (barberId: string | null) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!barberId) return;
    
    setLoading(true);
    try {
      console.log('💈 [Barbeiro] Buscando agendamentos para barbeiro:', barberId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('barbeiro_id', barberId)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      console.log('✅ [Barbeiro] Agendamentos encontrados:', data?.length || 0);

      if (data) {
        const appointmentsWithDetails = data.map((appointment: PainelAgendamento) => {
          // Usar parseISO para garantir timezone correto
          const appointmentDateTime = parseISO(`${appointment.data}T${appointment.hora}`);
          const endTime = new Date(appointmentDateTime.getTime() + (appointment.painel_servicos.duracao * 60000));

          return {
            id: appointment.id,
            start_time: appointmentDateTime.toISOString(),
            end_time: endTime.toISOString(),
            status: appointment.status === 'cancelado' ? 'cancelled' : 
                    appointment.status === 'confirmado' ? 'confirmed' : 
                    appointment.status === 'concluido' ? 'completed' :
                    appointment.status === 'FINALIZADO' ? 'completed' :
                    appointment.status === 'ausente' ? 'absent' : 'scheduled',
            client_name: appointment.painel_clientes.nome,
            service_name: appointment.painel_servicos.nome,
            service: {
              price: appointment.painel_servicos.preco
            },
            data: appointment.data,
            hora: appointment.hora
          } as AppointmentWithDetails;
        });
        
        setAppointments(appointmentsWithDetails);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  // ADICIONAR REALTIME LISTENERS
  useEffect(() => {
    if (!barberId) return;

    console.log('🔴 [Realtime] Configurando listeners para barbeiro:', barberId);

    // Criar canal realtime para este barbeiro
    const channel = supabase
      .channel(`barbearia:${barberId}`)
      .on(
        'broadcast',
        { event: 'CHECKIN' },
        (payload) => {
          console.log('🔔 [Realtime] Check-in recebido:', payload);
          toast.success('Cliente chegou!', {
            description: `${payload.payload.cliente_nome} fez check-in`
          });
          fetchAppointments();
        }
      )
      .on(
        'broadcast',
        { event: 'APPOINTMENT_COMPLETED' },
        (payload) => {
          console.log('🔔 [Realtime] Atendimento finalizado:', payload);
          toast.success('Atendimento finalizado!', {
            description: `${payload.payload.cliente_nome} - R$ ${payload.payload.total.toFixed(2)}`
          });
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barberId}`
        },
        (payload) => {
          console.log('🔔 [Realtime] Novo agendamento:', payload);
          toast.info('Novo agendamento!', {
            description: 'Você tem um novo agendamento'
          });
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barberId}`
        },
        (payload) => {
          console.log('🔔 [Realtime] Agendamento atualizado:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      console.log('🔴 [Realtime] Removendo listeners');
      supabase.removeChannel(channel);
    };
  }, [barberId, fetchAppointments]);

  return {
    appointments,
    loading,
    fetchAppointments,
    setAppointments
  };
};
