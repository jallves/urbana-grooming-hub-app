import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointmentSync } from '@/hooks/useAppointmentSync';

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
  const [barberData, setBarberData] = useState<any>(null);

  useEffect(() => {
    const fetchBarberId = async () => {
      if (!user?.email) return;

      try {
        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id, staff_id, commission_rate')
          .eq('email', user.email)
          .maybeSingle();

        if (data?.id) {
          setBarberId(data.id);
          setBarberData(data);
          console.log('Barber data found:', data);
        }
      } catch (error) {
        console.error('Error fetching barber ID:', error);
      }
    };

    fetchBarberId();
  }, [user?.email]);

  // Função de busca de agendamentos - estabilizada para evitar loops
  const fetchAppointmentsData = useCallback(async (currentBarberId: string) => {
    setLoading(true);
    try {
      console.log('Fetching barber appointments from painel_agendamentos for barber:', currentBarberId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('barbeiro_id', currentBarberId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Barber appointments found:', data.length);
        
        const appointmentsWithDetails = data.map((appointment: PainelAgendamento) => {
          // Corrigir criação da data para evitar problemas de timezone
          const appointmentDate = new Date(appointment.data + 'T' + appointment.hora);
          const endTime = new Date(appointmentDate.getTime() + (appointment.painel_servicos.duracao * 60000));

          return {
            id: appointment.id,
            start_time: appointmentDate.toISOString(),
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
  }, [toast]);

  // Função de refresh simplificada - sem dependências circulares
  const refreshAppointments = useCallback(() => {
    if (barberId) {
      fetchAppointmentsData(barberId);
    }
  }, [barberId, fetchAppointmentsData]);

  // Usar o hook de sincronização com função estável
  useAppointmentSync(refreshAppointments);

  // Busca inicial quando barberId está disponível - SEM fetchAppointmentsData nas dependências
  useEffect(() => {
    if (barberId) {
      fetchAppointmentsData(barberId);
    }
  }, [barberId]); // Removido fetchAppointmentsData para quebrar o ciclo

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

  const handleCompleteAppointment = useCallback(async (appointmentId: string) => {
    if (!barberId || !barberData) {
      toast({
        title: "Erro",
        description: "Dados do barbeiro não encontrados.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingId(appointmentId);
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) {
        toast({
          title: "Erro",
          description: "Agendamento não encontrado.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to complete appointment:', appointmentId);
      
      // Atualizar status para concluído na tabela painel_agendamentos
      const { error: updateError } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'concluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Erro ao marcar agendamento como concluído:', updateError);
        throw updateError;
      }

      // Atualizar estado local imediatamente
      setAppointments(prevAppointments => 
        prevAppointments.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: 'completed' }
            : appt
        )
      );

      const appointmentDate = new Date(appointment.start_time);

      toast({
        title: "✅ Agendamento Concluído!",
        description: `Agendamento de ${appointment.client_name} de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi marcado como concluído.`,
        duration: 4000,
      });

      console.log('Appointment completed successfully, sync should propagate the change');

    } catch (error) {
      console.error('Erro ao marcar agendamento como concluído:', error);
      
      // Reverter mudança local em caso de erro
      setAppointments(prevAppointments => 
        prevAppointments.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: appt.status === 'completed' ? 'scheduled' : appt.status }
            : appt
        )
      );
      
      toast({
        title: "Erro",
        description: "Não foi possível marcar o agendamento como concluído. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }, [barberId, barberData, appointments, toast]);

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
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

      // Atualizar estado local imediatamente
      setAppointments(prevAppointments => 
        prevAppointments.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: 'cancelled' }
            : appt
        )
      );

      toast({
        title: "❌ Agendamento Cancelado",
        description: `Agendamento de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi cancelado.`,
        duration: 4000,
      });

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
  }, [appointments, toast]);

  const handleEditAppointment = useCallback(async (appointmentId: string, startTime: string) => {
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
  }, [toast]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedAppointmentDate(null);
  }, []);

  return {
    appointments,
    loading,
    stats,
    updatingId,
    isEditModalOpen,
    selectedAppointmentId,
    selectedAppointmentDate,
    fetchAppointments: refreshAppointments,
    handleCompleteAppointment,
    handleCancelAppointment,
    handleEditAppointment,
    closeEditModal,
  };
};
