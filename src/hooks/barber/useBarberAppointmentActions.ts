
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentWithDetails {
  id: string;
  start_time: string;
  client_name: string;
  status: string;
}

interface UseBarberAppointmentActionsProps {
  barberId: string | null;
  onUpdate: () => void;
}

export const useBarberAppointmentActions = ({ barberId, onUpdate }: UseBarberAppointmentActionsProps) => {
  const handleCompleteAppointment = useCallback(async (appointmentId: string, appointment: AppointmentWithDetails) => {
    if (!barberId) {
      toast.error('Dados do barbeiro não encontrados');
      return false;
    }

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'concluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('✅ Agendamento Concluído!', {
        description: `Agendamento de ${appointment.client_name} foi marcado como concluído e sincronizado.`,
        duration: 4000,
      });

      onUpdate();
      return true;
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      toast.error('Erro ao concluir agendamento');
      return false;
    }
  }, [barberId, onUpdate]);

  const handleCancelAppointment = useCallback(async (appointmentId: string, appointment: AppointmentWithDetails) => {
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId);

      if (error) throw error;

      const appointmentDate = new Date(appointment.start_time);
      toast.success('❌ Agendamento Cancelado', {
        description: `Agendamento de ${format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi cancelado.`,
        duration: 4000,
      });

      onUpdate();
      return true;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
      return false;
    }
  }, [onUpdate]);

  return {
    handleCompleteAppointment,
    handleCancelAppointment
  };
};
