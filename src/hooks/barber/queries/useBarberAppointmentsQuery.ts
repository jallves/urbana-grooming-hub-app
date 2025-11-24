import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface AppointmentWithDetails {
  id: string;
  status: string;
  start_time: string;
  end_time: string;
  client_name: string;
  service_name: string;
  service?: {
    price?: number;
  };
}

export const useBarberAppointmentsQuery = (barberId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['barber-appointments', barberId],
    queryFn: async () => {
      if (!barberId) return [];

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          painel_clientes!inner(nome),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('barbeiro_id', barberId)
        .gte('data', thirtyDaysAgo.toISOString().split('T')[0])
        .order('data', { ascending: false })
        .order('hora', { ascending: false })
        .limit(100);

      if (!data) return [];

      return data.map((apt: any) => ({
        id: apt.id,
        status: apt.status,
        start_time: `${apt.data}T${apt.hora}`,
        end_time: `${apt.data}T${apt.hora}`,
        client_name: apt.painel_clientes?.nome || 'Cliente',
        service_name: apt.painel_servicos?.nome || 'Serviço',
        service: {
          price: apt.painel_servicos?.preco || 0
        }
      })) as AppointmentWithDetails[];
    },
    enabled: !!barberId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!barberId) return;

    const channel = supabase
      .channel('barber-appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos',
          filter: `barbeiro_id=eq.${barberId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['barber-appointments', barberId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, queryClient]);

  return query;
};
