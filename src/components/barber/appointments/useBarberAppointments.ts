
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

// Interface para agendamentos do painel do cliente adaptada para o barbeiro
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

export const useBarberAppointments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<Date | null>(null);

  const [barberId, setBarberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarberId = async () => {
      if (!user?.email) return;

      try {
        // Buscar na tabela painel_barbeiros usando o email do usuário logado
        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (data?.id) {
          setBarberId(data.id);
        }
      } catch (error) {
        console.error('Error fetching barber ID:', error);
      }
    };

    fetchBarberId();
  }, [user?.email]);

  const fetchAppointments = async () => {
    if (!barberId) return;
    setLoading(true);
    try {
      console.log('Fetching barber appointments from painel_agendamentos for barber:', barberId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('barbeiro_id', barberId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Barber appointments found:', data.length);
        
        const appointmentsWithDetails = data.map((appointment: PainelAgendamento) => {
          // Criar timestamp combinando data e hora
          const startTime = new Date(`${appointment.data}T${appointment.hora}`);
          const endTime = new Date(startTime.getTime() + (appointment.painel_servicos.duracao * 60000));

          return {
            id: appointment.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: appointment.status === 'cancelado' ? 'cancelled' : 
                    appointment.status === 'confirmado' ? 'confirmed' : 
                    appointment.status === 'concluido' ? 'completed' : 'scheduled',
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barberId) {
      fetchAppointments();
    }
  }, [barberId]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const upcoming = appointments.filter(a => 
      a.status !== 'completed' && 
      a.status !== 'cancelled' && 
      new Date(a.start_time) > new Date()
    ).length;
    
    const revenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appointment) => {
        const servicePrice = appointment.service?.price || 0;
        return acc + Number(servicePrice);
      }, 0);

    return { total, completed, upcoming, revenue };
  }, [appointments]);

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      const appointmentDate = new Date(appointment.start_time);
      
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'concluido' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao marcar agendamento como concluído:', error);
        toast({
          title: "Erro",
          description: "Não foi possível marcar o agendamento como concluído.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Agendamento Concluído!",
        description: `Agendamento de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi marcado como concluído.`,
        duration: 4000,
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erro ao marcar agendamento como concluído:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o agendamento como concluído.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      const appointmentDate = new Date(appointment.start_time);
      
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "❌ Agendamento Cancelado",
        description: `Agendamento de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi cancelado.`,
        duration: 4000,
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditAppointment = async (appointmentId: string, startTime: string) => {
    try {
      const appointmentDate = new Date(startTime);
      setSelectedAppointmentId(appointmentId);
      setSelectedAppointmentDate(appointmentDate);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedAppointmentDate(null);
  };

  return {
    appointments,
    loading,
    stats,
    updatingId,
    isEditModalOpen,
    selectedAppointmentId,
    selectedAppointmentDate,
    fetchAppointments,
    handleCompleteAppointment,
    handleCancelAppointment,
    handleEditAppointment,
    closeEditModal,
  };
};
