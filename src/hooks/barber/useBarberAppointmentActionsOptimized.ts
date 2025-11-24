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
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔄 [BARBEIRO] Cancelando agendamento:', appointmentId);
      console.log('👤 [BARBEIRO] Usuário autenticado:', user?.id, user?.email);
      console.log('🆔 [BARBEIRO] Barbeiro ID:', barberId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select();

      console.log('📊 [BARBEIRO] Resposta do cancelamento:', { data, error });

      if (error) {
        console.error('❌ [BARBEIRO] Erro RLS no cancelamento:', error);
        console.error('❌ [BARBEIRO] Detalhes do erro:', JSON.stringify(error, null, 2));
        toast.error('Erro ao cancelar agendamento', {
          description: error.message || 'Verifique suas permissões'
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [BARBEIRO] Update executado mas nenhum dado retornado - possível problema de RLS');
        toast.error('Erro de permissão', {
          description: 'Você não tem permissão para alterar este agendamento'
        });
        return false;
      }

      toast.success('Agendamento cancelado com sucesso');
      
      // Invalidar todos os caches relacionados a agendamentos
      queryClient.invalidateQueries({ queryKey: ['barber-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      
      return true;
    } catch (error: any) {
      console.error('❌ [BARBEIRO] Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento', {
        description: error?.message || 'Tente novamente'
      });
      return false;
    }
  }, [barberId, queryClient]);

  const handleMarkAsAbsent = useCallback(async (appointmentId: string) => {
    try {
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔄 [BARBEIRO] Marcando como ausente:', appointmentId);
      console.log('👤 [BARBEIRO] Usuário autenticado:', user?.id, user?.email);
      console.log('🆔 [BARBEIRO] Barbeiro ID:', barberId);
      
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
        console.error('❌ [BARBEIRO] Detalhes do erro:', JSON.stringify(error, null, 2));
        toast.error('Erro ao marcar como ausente', {
          description: error.message || 'Verifique suas permissões'
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [BARBEIRO] Update executado mas nenhum dado retornado - possível problema de RLS');
        toast.error('Erro de permissão', {
          description: 'Você não tem permissão para alterar este agendamento'
        });
        return false;
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
    } catch (error: any) {
      console.error('❌ [BARBEIRO] Erro ao marcar como ausente:', error);
      toast.error('Erro ao marcar como ausente', {
        description: error?.message || 'Tente novamente'
      });
      return false;
    }
  }, [barberId, queryClient]);

  return {
    handleCancelAppointment,
    handleMarkAsAbsent
  };
};
