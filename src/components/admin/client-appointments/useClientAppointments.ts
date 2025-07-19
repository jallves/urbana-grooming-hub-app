
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

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
  
  // Stable fetch function with proper error boundary
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
        // Don't throw here to prevent render loops
        return;
      }

      console.log('Client appointments found:', data?.length || 0);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      // Handle error without toast during render
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and subscription setup
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      await fetchAppointments();
      
      if (!mounted) return;
      
      // Set up real-time subscription
      const channel = supabase
        .channel('client-appointment-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'painel_agendamentos'
          },
          (payload) => {
            console.log('Client appointment data changed:', payload);
            if (mounted) {
              fetchAppointments();
            }
          }
        )
        .subscribe();

      return () => {
        mounted = false;
        console.log('Cleaning up client appointments subscription');
        supabase.removeChannel(channel);
      };
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
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
      
      // Toast after successful update
      setTimeout(() => {
        toast.success("Status atualizado", {
          description: "O status do agendamento foi atualizado com sucesso.",
        });
      }, 0);
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
      
      setTimeout(() => {
        toast.success("Agendamento excluído", {
          description: "O agendamento foi excluído com sucesso.",
        });
      }, 0);
      
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
      
      setTimeout(() => {
        toast.success("Agendamento atualizado", {
          description: "O agendamento foi atualizado com sucesso.",
        });
      }, 0);
      
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
