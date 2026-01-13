import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  isPastTime,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR
} from '@/lib/utils/timeCalculations';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

/**
 * Hook centralizado para validação de agendamentos
 */
export const useAppointmentValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const extractDatabaseError = useCallback((error: any): string => {
    if (!error?.message) return 'Erro ao processar agendamento';
    
    const message = error.message;
    
    if (message.includes('Conflito de horário')) {
      const match = message.match(/às (\d{2}:\d{2})/);
      if (match) {
        return `Este horário conflita com um agendamento às ${match[1]}. Escolha outro horário.`;
      }
      return 'Este horário já está ocupado. Escolha outro horário.';
    }
    
    if (message.includes('mais de 10 minutos') || message.includes('30 minutos de antecedência')) {
      return 'Este horário não está mais disponível.';
    }
    
    if (message.includes('Horário fora do expediente')) {
      return 'Horário de funcionamento: Segunda a Sábado 08:00-20:00, Domingo 09:00-13:00.';
    }
    
    if (message.includes('datas passadas')) {
      return 'Não é possível agendar para datas passadas.';
    }
    
    return 'Não foi possível realizar o agendamento. Tente novamente.';
  }, []);

  const validateNotPastTime = useCallback((date: Date, time: string): ValidationResult => {
    if (isPastTime(date, time)) {
      return {
        valid: false,
        error: 'Este horário não está mais disponível.'
      };
    }
    return { valid: true };
  }, []);

  /**
   * Verifica se há conflito usando check_barber_slot_availability
   */
  const checkAppointmentConflict = useCallback(async (
    staffId: string,
    date: Date,
    time: string,
    serviceDuration: number = 60,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const { data: isAvailable, error: rpcError } = await supabase.rpc('check_barber_slot_availability', {
        p_barber_id: staffId,
        p_date: dateStr,
        p_time: time,
        p_duration: serviceDuration
      });

      if (rpcError) {
        console.error('❌ Erro ao verificar disponibilidade:', rpcError);
        return { valid: false, error: 'Erro ao verificar disponibilidade' };
      }

      if (!isAvailable) {
        return { valid: false, error: `Horário ${time} não está disponível.` };
      }

      return { valid: true };
    } catch (error) {
      console.error('💥 Erro na verificação de conflitos:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade' };
    }
  }, []);

  const checkBusinessHours = useCallback((time: string, serviceDuration: number = 60): ValidationResult => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const endTimeInMinutes = timeInMinutes + serviceDuration;
    
    const startMinutes = BUSINESS_START_HOUR * 60;
    const endMinutes = BUSINESS_END_HOUR * 60;
    
    if (timeInMinutes < startMinutes || endTimeInMinutes > endMinutes) {
      return {
        valid: false,
        error: `Nosso horário de funcionamento é das ${BUSINESS_START_HOUR}:00 às ${BUSINESS_END_HOUR}:00.`
      };
    }
    return { valid: true };
  }, []);

  const validateAppointment = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number = 60,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      const pastTimeCheck = validateNotPastTime(date, time);
      if (!pastTimeCheck.valid) {
        toast.error(pastTimeCheck.error);
        return pastTimeCheck;
      }

      const conflictCheck = await checkAppointmentConflict(
        barberId,
        date,
        time,
        serviceDuration,
        excludeAppointmentId
      );
      
      if (!conflictCheck.valid) {
        toast.error(conflictCheck.error);
        return conflictCheck;
      }

      return { valid: true };
    } catch (error) {
      const errorMsg = 'Erro ao validar agendamento. Tente novamente.';
      toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsValidating(false);
    }
  }, [validateNotPastTime, checkAppointmentConflict]);

  /**
   * Busca horários disponíveis gerando slots e verificando disponibilidade
   */
  const getAvailableTimeSlots = useCallback(async (
    staffId: string,
    date: Date,
    serviceDuration: number = 60
  ): Promise<TimeSlot[]> => {
    setIsValidating(true);

    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = date.getDay();
      
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      // Buscar horário de trabalho
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (!workingHours) {
        return [];
      }

      // Buscar agendamentos existentes
      const { data: existingAppointments } = await supabase
        .from('painel_agendamentos')
        .select('hora, servico:painel_servicos(duracao)')
        .eq('barbeiro_id', staffId)
        .eq('data', dateStr)
        .neq('status', 'cancelado');

      // Gerar slots
      const slots: TimeSlot[] = [];
      const [startHour, startMin] = workingHours.start_time.split(':').map(Number);
      const [endHour, endMin] = workingHours.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      for (let mins = startMinutes; mins + serviceDuration <= endMinutes; mins += 30) {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        let available = true;
        let reason: string | undefined;

        // Verificar se é horário passado
        if (isToday && isPastTime(date, timeString)) {
          available = false;
          reason = 'Horário passado';
        }

        // Verificar conflitos
        if (available && existingAppointments) {
          for (const appt of existingAppointments) {
            const [apptHour, apptMin] = appt.hora.split(':').map(Number);
            const apptStart = apptHour * 60 + apptMin;
            const apptDuration = (appt.servico as any)?.duracao || 60;
            const apptEnd = apptStart + apptDuration;
            
            const slotEnd = mins + serviceDuration;
            
            if (mins < apptEnd && slotEnd > apptStart) {
              available = false;
              reason = 'Horário ocupado';
              break;
            }
          }
        }

        slots.push({ time: timeString, available, reason });
      }

      return slots;
    } catch (error) {
      console.error('❌ Erro ao buscar horários disponíveis:', error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    isValidating,
    validateAppointment,
    getAvailableTimeSlots,
    checkAppointmentConflict,
    validateNotPastTime,
    checkBusinessHours,
    extractDatabaseError
  };
};
