
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAppointmentValidation = () => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const validateAppointmentConflict = async (
    staffId: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.rpc('check_appointment_conflict', {
        p_staff_id: staffId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_appointment_id: excludeAppointmentId || null,
      });

      if (error) {
        console.error('Error checking appointment conflict:', error);
        toast({
          title: "Erro",
          description: "Não foi possível validar a disponibilidade.",
          variant: "destructive",
        });
        return true; // Assume conflict to be safe
      }

      if (data) {
        toast({
          title: "Conflito de agendamento",
          description: "Este horário já está ocupado. Por favor, escolha outro horário.",
          variant: "destructive",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating appointment:', error);
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateAppointmentConflict,
    isValidating,
  };
};
