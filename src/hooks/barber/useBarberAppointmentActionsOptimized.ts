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
      console.log('🔄 [BARBEIRO] Marcando como ausente:', appointmentId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'ausente',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select();

      console.log('📊 [BARBEIRO] Resposta do update:', { data, error });

      if (error) {
        console.error('❌ [BARBEIRO] Erro RLS:', error);
        throw error;
      }

      console.log('✅ [BARBEIRO] Status alterado para ausente com sucesso');
      console.log('📡 [BARBEIRO] Real-time deve notificar o admin automaticamente');

      toast.warning('Cliente marcado como ausente', {
        description: 'Este agendamento não gerará receita ou comissão'
      });
      
      // Invalidar todos os caches relacionados a agendamentos
      queryClient.invalidateQueries({ queryKey: ['barber-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      
      return true;
    } catch (error) {
      console.error('❌ [BARBEIRO] Erro ao marcar como ausente:', error);
      toast.error('Erro ao marcar como ausente');
      return false;
    }
  }, [barberId, queryClient]);

  return {
    handleCancelAppointment,
    handleMarkAsAbsent
  };
};
