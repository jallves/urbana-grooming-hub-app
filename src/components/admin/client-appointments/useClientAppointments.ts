
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
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
  
  // Função estável para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching client appointments from painel_agendamentos');
      
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

      if (error) {
        console.error('Error fetching client appointments:', error);
        return;
      }

      console.log('Client appointments found:', data?.length || 0);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching client appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Usar o hook de sincronização
  useAppointmentSync(fetchAppointments);

  // Busca inicial
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      const painelStatus = newStatus === 'cancelled' ? 'cancelado' : 
                          newStatus === 'confirmed' ? 'confirmado' : 
                          newStatus === 'completed' ? 'concluido' : 'confirmado';

      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: painelStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Update local state immediately
      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status: painelStatus } : appointment
      ));
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setTimeout(() => {
        toast.error("Erro", {
          description: "Não foi possível atualizar o status.",
        });
      }, 0);
    }
  }, []);
  
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Update local state immediately
      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setTimeout(() => {
        toast.error("Erro", {
          description: "Não foi possível excluir o agendamento.",
        });
      }, 0);
      return false;
    }
  }, []);

  const handleUpdateAppointment = useCallback(async (appointmentId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update(data)
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Refresh data
      await fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      setTimeout(() => {
        toast.error("Erro", {
          description: "Não foi possível atualizar o agendamento.",
        });
      }, 0);
      return false;
    }
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment
  };
};
