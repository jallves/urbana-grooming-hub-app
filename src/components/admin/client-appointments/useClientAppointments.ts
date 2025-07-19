
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

  // Usar o hook de sincronização - passando a função de callback apenas uma vez
  useAppointmentSync(fetchAppointments);

  // Busca inicial - sem dependência de fetchAppointments para evitar loops
  useEffect(() => {
    let mounted = true;
    
    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        console.log('Initial fetch of client appointments');
        
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

        if (mounted) {
          console.log('Client appointments found:', data?.length || 0);
          setAppointments(data || []);
        }
      } catch (error) {
        console.error('Error fetching client appointments:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      mounted = false;
    };
  }, []);

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
      
      // Trigger a refresh by calling fetchAppointments
      fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
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
