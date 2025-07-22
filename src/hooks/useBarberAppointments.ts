
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BarberAppointment {
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

export const useBarberAppointments = () => {
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      
      // Primeiro, buscar o barbeiro pela email
      const { data: barberData, error: barberError } = await supabase
        .from('painel_barbeiros')
        .select('id')
        .eq('email', user.email)
        .single();

      if (barberError || !barberData) {
        console.error('Erro ao buscar barbeiro:', barberError);
        return;
      }

      // Buscar agendamentos do barbeiro
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('barbeiro_id', barberData.id)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Erro no useBarberAppointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar agendamento');
        return;
      }

      // Atualizar estado local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus, updated_at: new Date().toISOString() }
            : apt
        )
      );

      const statusMessages = {
        'concluido': 'Agendamento concluído com sucesso!',
        'cancelado': 'Agendamento cancelado',
        'confirmado': 'Agendamento confirmado'
      };

      toast.success(statusMessages[newStatus as keyof typeof statusMessages] || 'Status atualizado');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Configurar listener para atualizações em tempo real
  useEffect(() => {
    if (!user?.email) return;

    const subscription = supabase
      .channel('barber_appointments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'painel_agendamentos'
        }, 
        (payload) => {
          console.log('Agendamento atualizado:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.email, fetchAppointments]);

  return {
    appointments,
    loading,
    updateAppointmentStatus,
    refetch: fetchAppointments
  };
};
