import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAppointmentCompletion = () => {
  const [completing, setCompleting] = useState(false);

  const completeAppointment = async (appointmentId: string) => {
    setCompleting(true);
    
    try {
      console.log('🎯 Finalizando agendamento:', appointmentId);

      const { data, error } = await supabase.functions.invoke('process-appointment-completion', {
        body: {
          agendamento_id: appointmentId,
          source: 'admin',
          completed_by: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      console.log('✅ Resposta da finalização:', data);

      if (data.success) {
        toast.success('Atendimento finalizado com sucesso!', {
          description: `Comissão de R$ ${data.data.commission_amount.toFixed(2)} gerada automaticamente`
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('❌ Erro ao finalizar agendamento:', error);
      toast.error('Erro ao finalizar agendamento', {
        description: error.message || 'Tente novamente'
      });
      return false;
    } finally {
      setCompleting(false);
    }
  };

  return {
    completing,
    completeAppointment
  };
};
