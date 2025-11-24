import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UseBarberAppointmentActionsProps {
  barberId: string | null;
}

export const useBarberAppointmentActionsOptimized = ({ barberId }: UseBarberAppointmentActionsProps) => {
  const queryClient = useQueryClient();

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      console.log('🔄 Cancelando agendamento:', appointmentId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select();

      console.log('📊 Resposta do cancelamento:', { data, error });

      if (error) {
        console.error('❌ Erro RLS no cancelamento:', error);
        throw error;
      }

      toast.success('Agendamento cancelado com sucesso');
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['barber-appointments', barberId] });
      return true;
    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
      return false;
    }
  }, [barberId, queryClient]);

  const handleMarkAsAbsent = useCallback(async (appointmentId: string) => {
    try {
      console.log('🔄 Marcando como ausente:', appointmentId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'ausente',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select();

      console.log('📊 Resposta do update:', { data, error });

      if (error) {
        console.error('❌ Erro RLS:', error);
        throw error;
      }

      toast.warning('Cliente marcado como ausente', {
        description: 'Este agendamento não gerará receita ou comissão'
      });
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['barber-appointments', barberId] });
      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar como ausente:', error);
      toast.error('Erro ao marcar como ausente');
      return false;
    }
  }, [barberId, queryClient]);

  return {
    handleCancelAppointment,
    handleMarkAsAbsent
  };
};
