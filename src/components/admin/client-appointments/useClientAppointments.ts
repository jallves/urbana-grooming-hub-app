import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppointmentSync } from '@/hooks/useAppointmentSync';

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
  painel_barbeiros: {
    nome: string;
    email: string;
    telefone: string;
    image_url: string;
    specialties: string;
    experience: string;
    commission_rate: number;
    is_active: boolean;
    role: string;
    staff_id: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<PainelAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_barbeiros!inner(nome, email, telefone, image_url, specialties, experience, commission_rate, is_active, role, staff_id),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Usa o hook de sincronização para atualizar lista em eventos externos
  useAppointmentSync(fetchAppointments);

  // Busca inicial dos agendamentos
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Atualiza status de agendamento
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    // Mapeia status para valores do banco
    const painelStatus =
      newStatus === 'cancelled' ? 'cancelado' :
      newStatus === 'confirmed' ? 'confirmado' :
      newStatus === 'completed' ? 'concluido' : 'confirmado';

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: painelStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Atualiza localmente para refletir mudanças imediatas
      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === appointmentId ? { ...appointment, status: painelStatus } : appointment
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
    }
  }, []);

  // Deleta agendamento
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      return true;
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      return false;
    }
  }, []);

  // Atualiza agendamento (data, hora, barbeiro, serviço)
  const handleUpdateAppointment = useCallback(async (appointmentId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update(data)
        .eq('id', appointmentId);

      if (error) throw error;

      // Atualiza lista após edição
      fetchAppointments();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      return false;
    }
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment,
  };
};
