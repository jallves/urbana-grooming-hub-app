
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  // Real-time subscription
  useEffect(() => {
    if (barberId) {
      fetchAppointments();

      // Subscribe to real-time changes
      const channel = supabase
        .channel('painel_agendamentos_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'painel_agendamentos',
            filter: `barbeiro_id=eq.${barberId}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            fetchAppointments(); // Refresh appointments when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
      
      // 1. Update appointment status to completed FIRST
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

      // 2. Update local state IMMEDIATELY for better UX
      setAppointments(prevAppointments => 
        prevAppointments.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: 'completed' }
            : appt
        )
      );

      console.log('Appointment marked as completed successfully');

      // 3. Create commission record in background
      const servicePrice = appointment.service?.price || 0;
      
      if (servicePrice > 0 && barberData.staff_id) {
        try {
          // Get commission rate from staff
          const { data: staffData } = await supabase
            .from('staff')
            .select('commission_rate')
            .eq('id', barberData.staff_id)
            .maybeSingle();

          const commissionRate = staffData?.commission_rate || 30;
          const commissionAmount = servicePrice * (commissionRate / 100);

          console.log('Creating commission:', {
            appointmentId,
            barberId: barberData.staff_id,
            amount: commissionAmount,
            servicePrice,
            commissionRate
          });

          const { error: commissionError } = await supabase
            .from('barber_commissions')
            .insert({
              barber_id: barberData.staff_id,
              appointment_id: appointmentId,
              amount: commissionAmount,
              commission_rate: commissionRate,
              status: 'pending'
            });

          if (commissionError) {
            console.error('Erro ao criar comissão:', commissionError);
            // Don't fail the entire operation for commission error
          } else {
            console.log('Commission created successfully:', commissionAmount);
          }
        } catch (error) {
          console.error('Error creating commission:', error);
          // Don't fail the entire operation for commission error
        }
      }

      // 4. Create cash flow entry in background
      if (servicePrice > 0) {
        try {
          const { error: cashFlowError } = await supabase
            .from('cash_flow')
            .insert({
              transaction_type: 'income',
              amount: servicePrice,
              description: `Serviço: ${appointment.service_name} - Cliente: ${appointment.client_name}`,
              category: 'Serviços',
              payment_method: 'Dinheiro',
              transaction_date: new Date().toISOString().split('T')[0],
              reference_id: appointmentId,
              reference_type: 'appointment'
            });

          if (cashFlowError) {
            console.error('Erro ao registrar no fluxo de caixa:', cashFlowError);
          }
        } catch (error) {
          console.error('Error creating cash flow entry:', error);
        }
      }

      const appointmentDate = new Date(appointment.start_time);

      // 5. Show success message
      toast({
        title: "✅ Agendamento Concluído!",
        description: `Agendamento de ${appointment.client_name} de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi marcado como concluído.`,
        duration: 4000,
      });

    } catch (error) {
      console.error('Erro ao marcar agendamento como concluído:', error);
      
      // Revert local state change on error
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

      // Update local state immediately
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
