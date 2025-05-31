import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types/appointment';

interface AppointmentWithDetails extends Appointment {
  client_name: string;
  service_name: string;
}

export const useBarberAppointments = (barberId: string) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (name),
          services (name)
        `)
        .eq('staff_id', barberId)
        .order('start_time', { ascending: true });

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
        const appointmentsWithDetails = data.map(appointment => ({
          ...appointment,
          client_name: (appointment.clients as any)?.name || 'Cliente Desconhecido',
          service_name: (appointment.services as any)?.name || 'Serviço Desconhecido',
        })) as AppointmentWithDetails[];
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

  const handleCompleteAppointment = async (appointmentId: string, startTime: string) => {
    try {
      // Convert string to Date for internal processing
      const appointmentDate = new Date(startTime);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
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
    }
  };

  const handleCancelAppointment = async (appointmentId: string, startTime: string) => {
    try {
      // Convert string to Date for internal processing
      const appointmentDate = new Date(startTime);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
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
    }
  };

  const handleEditAppointment = async (appointmentId: string, startTime: string) => {
    try {
      // Convert string to Date for internal processing
      const appointmentDate = new Date(startTime);
      
      // For now, just show a toast - implement edit functionality later
      toast({
        title: "Editar Agendamento",
        description: `Funcionalidade de edição será implementada em breve para o agendamento de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar o agendamento.",
        variant: "destructive",
      });
    }
  };

  return {
    appointments,
    loading,
    fetchAppointments,
    handleCompleteAppointment,
    handleCancelAppointment,
    handleEditAppointment,
  };
};
