import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  isPastTime,
  BUFFER_MINUTES,
  BUSINESS_START_HOUR,
  BUSINESS_START_MINUTE,
  BUSINESS_END_HOUR,
  SUNDAY_START_HOUR,
  SUNDAY_END_HOUR
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
 * Hook UNIFICADO para validação de agendamentos
 * Usado por: Painel do Cliente, Painel Administrativo, Totem
 * 
 * REGRAS DE NEGÓCIO:
 * - Buffer de 10 minutos entre agendamentos
 * - Horário Segunda a Sábado: 08:30 às 20:00 (primeiro atendimento às 08:30)
 * - Horário Domingo: 09:00 às 13:00
 * - Slots de 30 minutos
 * - Serviço deve terminar antes do fechamento
 */
export const useUnifiedAppointmentValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Formata data para string YYYY-MM-DD sem problemas de timezone
   */
  const formatDateLocal = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * Verifica se a data é hoje
   */
  const isDateToday = useCallback((date: Date): boolean => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }, []);

  /**
   * Converte horário para minutos desde meia-noite
   */
  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  /**
   * Converte minutos para string de horário
   */
  const minutesToTime = useCallback((totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Valida se o horário não está no passado
   */
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
   * Valida horário de funcionamento considerando o dia da semana
   */
  const validateBusinessHours = useCallback((
    date: Date, 
    time: string, 
    serviceDuration: number
  ): ValidationResult => {
    const dayOfWeek = date.getDay();
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;
    
    // Domingo tem horário especial
    if (dayOfWeek === 0) {
      const sundayStart = SUNDAY_START_HOUR * 60;
      const sundayEnd = SUNDAY_END_HOUR * 60;
      
      if (startMinutes < sundayStart || endMinutes > sundayEnd) {
        return {
          valid: false,
          error: `Horário de domingo: ${SUNDAY_START_HOUR}:00 às ${SUNDAY_END_HOUR}:00`
        };
      }
      return { valid: true };
    }
    
    // Segunda a Sábado
    const businessStart = BUSINESS_START_HOUR * 60 + BUSINESS_START_MINUTE; // 08:30
    const businessEnd = BUSINESS_END_HOUR * 60; // 20:00
    
    if (startMinutes < businessStart) {
      return {
        valid: false,
        error: `Primeiro atendimento às ${BUSINESS_START_HOUR}:${BUSINESS_START_MINUTE.toString().padStart(2, '0')}`
      };
    }
    
    if (endMinutes > businessEnd) {
      return {
        valid: false,
        error: `O serviço deve terminar antes das ${BUSINESS_END_HOUR}:00`
      };
    }
    
    return { valid: true };
  }, [timeToMinutes]);

  /**
   * Verifica horário de trabalho do barbeiro
   */
  const checkBarberWorkingHours = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number
  ): Promise<ValidationResult> => {
    const dayOfWeek = date.getDay();
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;

    // Buscar horário de trabalho - tenta primeiro pelo id do barbeiro
    let { data: workingHours, error } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_active')
      .eq('staff_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar horário de trabalho:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade do barbeiro' };
    }

    if (!workingHours) {
      return { valid: false, error: 'O barbeiro não trabalha neste dia' };
    }

    const whStart = timeToMinutes(workingHours.start_time);
    const whEnd = timeToMinutes(workingHours.end_time);

    if (startMinutes < whStart || endMinutes > whEnd) {
      return {
        valid: false,
        error: `Horário do barbeiro: ${workingHours.start_time} às ${workingHours.end_time}`
      };
    }

    return { valid: true };
  }, [timeToMinutes]);

  /**
   * Verifica disponibilidade específica (folgas/bloqueios)
   */
  const checkBarberSpecificAvailability = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number
  ): Promise<ValidationResult> => {
    const dateStr = formatDateLocal(date);
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;

    const { data: availability, error } = await supabase
      .from('barber_availability')
      .select('is_available, start_time, end_time')
      .eq('barber_id', barberId)
      .eq('date', dateStr)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar disponibilidade específica:', error);
      return { valid: true }; // Em caso de erro, não bloqueia
    }

    if (!availability) {
      return { valid: true }; // Sem registro = disponível
    }

    if (!availability.is_available) {
      return { valid: false, error: 'O barbeiro não está disponível neste dia' };
    }

    // Se há horário específico, verificar
    if (availability.start_time && availability.end_time) {
      const availStart = timeToMinutes(availability.start_time);
      const availEnd = timeToMinutes(availability.end_time);
      
      if (startMinutes < availStart || endMinutes > availEnd) {
        return {
          valid: false,
          error: `Barbeiro disponível apenas entre ${availability.start_time} e ${availability.end_time}`
        };
      }
    }

    return { valid: true };
  }, [formatDateLocal, timeToMinutes]);

  /**
   * Verifica conflitos com agendamentos existentes
   * INCLUI buffer de 10 minutos entre agendamentos
   */
  const checkAppointmentConflicts = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    const dateStr = formatDateLocal(date);
    const newStart = timeToMinutes(time);
    const newEnd = newStart + serviceDuration + BUFFER_MINUTES; // INCLUI BUFFER

    let query = supabase
      .from('painel_agendamentos')
      .select('id, hora, servico:painel_servicos(duracao)')
      .eq('barbeiro_id', barberId)
      .eq('data', dateStr)
      .not('status', 'in', '("cancelado","ausente")');

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Erro ao verificar conflitos:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade' };
    }

    if (!appointments || appointments.length === 0) {
      return { valid: true };
    }

    for (const apt of appointments) {
      const aptStart = timeToMinutes(apt.hora);
      const aptDuration = (apt.servico as any)?.duracao || 60;
      const aptEnd = aptStart + aptDuration + BUFFER_MINUTES; // INCLUI BUFFER

      // Verificar sobreposição com buffer
      // Sobreposição: (novo_inicio < existente_fim) AND (novo_fim > existente_inicio)
      if (newStart < aptEnd && newEnd > aptStart) {
        return {
          valid: false,
          error: `Conflito com agendamento às ${apt.hora}. Próximo horário disponível: ${minutesToTime(aptEnd)}`
        };
      }
    }

    return { valid: true };
  }, [formatDateLocal, timeToMinutes, minutesToTime]);

  /**
   * Validação completa de agendamento
   * Ordem: horário passado -> horário funcionamento -> horário barbeiro -> folgas -> conflitos
   */
  const validateAppointment = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number,
    excludeAppointmentId?: string,
    showToast: boolean = true
  ): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      // 1. Verificar horário passado
      const pastCheck = validateNotPastTime(date, time);
      if (!pastCheck.valid) {
        if (showToast) toast.error(pastCheck.error);
        return pastCheck;
      }

      // 2. Verificar horário de funcionamento
      const businessCheck = validateBusinessHours(date, time, serviceDuration);
      if (!businessCheck.valid) {
        if (showToast) toast.error(businessCheck.error);
        return businessCheck;
      }

      // 3. Verificar horário de trabalho do barbeiro
      const workingCheck = await checkBarberWorkingHours(barberId, date, time, serviceDuration);
      if (!workingCheck.valid) {
        if (showToast) toast.error(workingCheck.error);
        return workingCheck;
      }

      // 4. Verificar disponibilidade específica (folgas)
      const availabilityCheck = await checkBarberSpecificAvailability(barberId, date, time, serviceDuration);
      if (!availabilityCheck.valid) {
        if (showToast) toast.error(availabilityCheck.error);
        return availabilityCheck;
      }

      // 5. Verificar conflitos com outros agendamentos
      const conflictCheck = await checkAppointmentConflicts(
        barberId,
        date,
        time,
        serviceDuration,
        excludeAppointmentId
      );
      if (!conflictCheck.valid) {
        if (showToast) toast.error(conflictCheck.error);
        return conflictCheck;
      }

      return { valid: true };
    } catch (error) {
      console.error('Erro na validação de agendamento:', error);
      const errorMsg = 'Erro ao validar agendamento. Tente novamente.';
      if (showToast) toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsValidating(false);
    }
  }, [
    validateNotPastTime,
    validateBusinessHours,
    checkBarberWorkingHours,
    checkBarberSpecificAvailability,
    checkAppointmentConflicts
  ]);

  /**
   * Busca horários disponíveis para um barbeiro em uma data
   * Considera buffer de 10 minutos entre agendamentos
   */
  const getAvailableTimeSlots = useCallback(async (
    barberId: string,
    date: Date,
    serviceDuration: number
  ): Promise<TimeSlot[]> => {
    setIsValidating(true);

    try {
      const dateStr = formatDateLocal(date);
      const dayOfWeek = date.getDay();
      const isToday = isDateToday(date);

      // Buscar horário de trabalho
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (!workingHours) {
        return [];
      }

      // Verificar disponibilidade específica
      const { data: specificAvailability } = await supabase
        .from('barber_availability')
        .select('is_available, start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', dateStr)
        .maybeSingle();

      if (specificAvailability?.is_available === false) {
        return []; // Barbeiro não disponível neste dia
      }

      // Determinar horário efetivo
      let effectiveStart = workingHours.start_time;
      let effectiveEnd = workingHours.end_time;

      if (specificAvailability?.start_time) {
        effectiveStart = specificAvailability.start_time;
      }
      if (specificAvailability?.end_time) {
        effectiveEnd = specificAvailability.end_time;
      }

      // Buscar agendamentos existentes
      const { data: existingAppointments } = await supabase
        .from('painel_agendamentos')
        .select('hora, servico:painel_servicos(duracao)')
        .eq('barbeiro_id', barberId)
        .eq('data', dateStr)
        .not('status', 'in', '("cancelado","ausente")');

      // Mapear períodos ocupados com buffer
      const occupiedPeriods: { start: number; end: number }[] = [];
      existingAppointments?.forEach((apt) => {
        const aptStart = timeToMinutes(apt.hora);
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const aptEnd = aptStart + aptDuration + BUFFER_MINUTES;
        occupiedPeriods.push({ start: aptStart, end: aptEnd });
      });

      // Gerar slots
      const slots: TimeSlot[] = [];
      const startMinutes = timeToMinutes(effectiveStart);
      const endMinutes = timeToMinutes(effectiveEnd);

      for (let mins = startMinutes; mins + serviceDuration <= endMinutes; mins += 30) {
        const timeString = minutesToTime(mins);
        const slotEnd = mins + serviceDuration;
        
        let available = true;
        let reason: string | undefined;

        // Verificar horário passado
        if (isToday && isPastTime(date, timeString)) {
          available = false;
          reason = 'Horário passado';
        }

        // Verificar conflitos com buffer
        if (available) {
          for (const period of occupiedPeriods) {
            // Verifica se novo slot + buffer conflita com período ocupado
            if (mins < period.end && slotEnd + BUFFER_MINUTES > period.start) {
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
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [formatDateLocal, isDateToday, timeToMinutes, minutesToTime]);

  return {
    isValidating,
    validateAppointment,
    getAvailableTimeSlots,
    validateNotPastTime,
    validateBusinessHours,
    checkBarberWorkingHours,
    checkBarberSpecificAvailability,
    checkAppointmentConflicts,
    formatDateLocal,
    timeToMinutes,
    minutesToTime
  };
};
