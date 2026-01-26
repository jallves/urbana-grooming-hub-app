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
  SUNDAY_END_HOUR,
  getSundayHours,
  HOMOLOGATION_MODE
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
 * - Horário Segunda a Sábado: 09:00 às 20:00
 * - Horário Domingo: 09:00 às 13:00 (em produção) / igual aos outros dias (em homologação)
 * - Slots de 30 minutos
 * - Serviço deve terminar antes do fechamento
 * - HOMOLOGATION_MODE: Configurado em timeCalculations.ts
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
   * Em HOMOLOGATION_MODE, domingo funciona igual aos outros dias
   */
  const validateBusinessHours = useCallback((
    date: Date, 
    time: string, 
    serviceDuration: number
  ): ValidationResult => {
    const dayOfWeek = date.getDay();
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;
    
    // Domingo tem horário especial (exceto em homologação)
    if (dayOfWeek === 0) {
      const sundayHours = getSundayHours();
      const sundayStart = sundayHours.start * 60;
      const sundayEnd = sundayHours.end * 60;
      
      if (startMinutes < sundayStart || endMinutes > sundayEnd) {
        return {
          valid: false,
          error: `Horário de domingo: ${sundayHours.start}:00 às ${sundayHours.end}:00`
        };
      }
      return { valid: true };
    }
    
    // Segunda a Sábado
    const businessStart = BUSINESS_START_HOUR * 60 + BUSINESS_START_MINUTE; // 09:00
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
   * Resolve o staff_id correto para queries de working_hours
   * Retorna o ID da tabela staff ou o barberId como fallback
   */
  const resolveStaffId = useCallback(async (barberId: string): Promise<string> => {
    // Primeiro, buscar o staff_id do barbeiro na tabela painel_barbeiros
    const { data: barberData } = await supabase
      .from('painel_barbeiros')
      .select('staff_id')
      .eq('id', barberId)
      .maybeSingle();

    const authStaffId = barberData?.staff_id || barberId;

    // Resolver o ID correto da tabela staff (working_hours.staff_id referencia staff.id)
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id')
      .eq('staff_id', authStaffId)
      .maybeSingle();

    return staffRecord?.id || authStaffId;
  }, []);

  /**
   * Verifica horário de trabalho do barbeiro
   * OTIMIZADO: Recebe staffTableId já resolvido para evitar queries duplicadas
   */
  const checkBarberWorkingHoursWithStaffId = useCallback(async (
    staffTableId: string,
    date: Date,
    time: string,
    serviceDuration: number
  ): Promise<ValidationResult> => {
    const dayOfWeek = date.getDay();
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;

    // Buscar horário de trabalho usando staff.id (não auth.uid)
    const { data: workingHours, error } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_active')
      .eq('staff_id', staffTableId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar horário de trabalho:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade do barbeiro' };
    }

    if (!workingHours) {
      console.log('⚠️ Nenhum horário de trabalho encontrado para staff_id:', staffTableId, 'dia:', dayOfWeek);
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
   * Wrapper para manter compatibilidade com chamadas antigas
   */
  const checkBarberWorkingHours = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number
  ): Promise<ValidationResult> => {
    const staffTableId = await resolveStaffId(barberId);
    return checkBarberWorkingHoursWithStaffId(staffTableId, date, time, serviceDuration);
  }, [resolveStaffId, checkBarberWorkingHoursWithStaffId]);

  /**
   * Verifica folgas programadas (tabela time_off)
   */
  const checkBarberTimeOff = useCallback(async (
    barberId: string,
    date: Date
  ): Promise<ValidationResult> => {
    const dateStr = formatDateLocal(date);

    const { data: timeOff, error } = await supabase
      .from('time_off')
      .select('id, type, reason')
      .eq('barber_id', barberId)
      .eq('status', 'ativo')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar folgas:', error);
      return { valid: true }; // Em caso de erro, não bloqueia
    }

    if (timeOff) {
      const typeLabels: Record<string, string> = {
        folga: 'folga',
        ferias: 'férias',
        licenca: 'licença',
        feriado: 'feriado',
        outro: 'ausência',
      };
      const typeLabel = typeLabels[timeOff.type] || 'ausência';
      return { 
        valid: false, 
        error: `O barbeiro está em ${typeLabel} neste dia` 
      };
    }

    return { valid: true };
  }, [formatDateLocal]);

  /**
   * Verifica disponibilidade específica (bloqueios de horários)
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

    // Buscar TODOS os registros de disponibilidade para o dia (pode haver múltiplos slots bloqueados)
    const { data: availabilityRecords, error } = await supabase
      .from('barber_availability')
      .select('is_available, start_time, end_time')
      .eq('barber_id', barberId)
      .eq('date', dateStr);

    if (error) {
      console.error('Erro ao verificar disponibilidade específica:', error);
      return { valid: true }; // Em caso de erro, não bloqueia
    }

    if (!availabilityRecords || availabilityRecords.length === 0) {
      return { valid: true }; // Sem registro = disponível
    }

    // Verificar se algum bloqueio afeta o horário solicitado
    for (const availability of availabilityRecords) {
      if (!availability.is_available) {
        // Verificar se o bloqueio se sobrepõe ao horário solicitado
        const blockStart = timeToMinutes(availability.start_time);
        const blockEnd = timeToMinutes(availability.end_time);
        
        // Verifica sobreposição: novo agendamento começa antes do bloqueio terminar E termina depois do bloqueio começar
        if (startMinutes < blockEnd && endMinutes > blockStart) {
          return { 
            valid: false, 
            error: `Horário bloqueado: ${availability.start_time.substring(0, 5)} - ${availability.end_time.substring(0, 5)}` 
          };
        }
      }
    }

    // Verificar disponibilidade específica (quando is_available = true com horário definido)
    const specificAvailability = availabilityRecords.find(a => a.is_available);
    if (specificAvailability && specificAvailability.start_time && specificAvailability.end_time) {
      const availStart = timeToMinutes(specificAvailability.start_time);
      const availEnd = timeToMinutes(specificAvailability.end_time);
      
      if (startMinutes < availStart || endMinutes > availEnd) {
        return {
          valid: false,
          error: `Barbeiro disponível apenas entre ${specificAvailability.start_time.substring(0, 5)} e ${specificAvailability.end_time.substring(0, 5)}`
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
   * Validação completa de agendamento - OTIMIZADO
   * Ordem: horário passado -> horário funcionamento -> horário barbeiro -> folgas -> conflitos
   * Resolve staffId uma única vez e executa queries em paralelo quando possível
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
      console.log('🔍 [validateAppointment] Iniciando validação:', { barberId, date: date.toISOString(), time, serviceDuration });

      // 1. Verificar horário passado (síncrono, rápido)
      const pastCheck = validateNotPastTime(date, time);
      if (!pastCheck.valid) {
        console.log('❌ [validateAppointment] Horário passado');
        if (showToast) toast.error(pastCheck.error);
        return pastCheck;
      }

      // 2. Verificar horário de funcionamento (síncrono, rápido)
      const businessCheck = validateBusinessHours(date, time, serviceDuration);
      if (!businessCheck.valid) {
        console.log('❌ [validateAppointment] Fora do horário de funcionamento');
        if (showToast) toast.error(businessCheck.error);
        return businessCheck;
      }

      // 3. OTIMIZAÇÃO: Resolver staffId uma única vez
      const staffTableId = await resolveStaffId(barberId);
      console.log('🔗 [validateAppointment] Staff ID resolvido:', { barberId, staffTableId });

      // 4. Executar verificações assíncronas em PARALELO
      const [workingCheck, timeOffCheck, availabilityCheck, conflictCheck] = await Promise.all([
        // Verificar horário de trabalho do barbeiro usando staffTableId já resolvido
        checkBarberWorkingHoursWithStaffId(staffTableId, date, time, serviceDuration),
        // Verificar folgas programadas (tabela time_off)
        checkBarberTimeOff(barberId, date),
        // Verificar disponibilidade específica (bloqueios)
        checkBarberSpecificAvailability(barberId, date, time, serviceDuration),
        // Verificar conflitos com outros agendamentos
        checkAppointmentConflicts(barberId, date, time, serviceDuration, excludeAppointmentId)
      ]);

      // Processar resultados na ordem de prioridade
      if (!workingCheck.valid) {
        console.log('❌ [validateAppointment] Fora do horário do barbeiro');
        if (showToast) toast.error(workingCheck.error);
        return workingCheck;
      }

      if (!timeOffCheck.valid) {
        console.log('❌ [validateAppointment] Barbeiro em folga');
        if (showToast) toast.error(timeOffCheck.error);
        return timeOffCheck;
      }

      if (!availabilityCheck.valid) {
        console.log('❌ [validateAppointment] Barbeiro indisponível');
        if (showToast) toast.error(availabilityCheck.error);
        return availabilityCheck;
      }

      if (!conflictCheck.valid) {
        console.log('❌ [validateAppointment] Conflito de horário');
        if (showToast) toast.error(conflictCheck.error);
        return conflictCheck;
      }

      console.log('✅ [validateAppointment] Validação OK!');
      return { valid: true };
    } catch (error) {
      console.error('💥 [validateAppointment] Erro na validação:', error);
      const errorMsg = 'Erro ao validar agendamento. Tente novamente.';
      if (showToast) toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsValidating(false);
    }
  }, [
    validateNotPastTime,
    validateBusinessHours,
    resolveStaffId,
    checkBarberWorkingHoursWithStaffId,
    checkBarberTimeOff,
    checkBarberSpecificAvailability,
    checkAppointmentConflicts
  ]);

  /**
   * Busca horários disponíveis para um barbeiro em uma data
   * OTIMIZADO: Queries em paralelo para melhor performance
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

      console.log('🔍 [getAvailableTimeSlots] Iniciando busca:', { barberId, dateStr, dayOfWeek, serviceDuration });

      // OTIMIZAÇÃO: Resolver staff_id primeiro
      const staffTableId = await resolveStaffId(barberId);
      console.log('🔗 [getAvailableTimeSlots] Staff ID resolvido:', staffTableId);

      // OTIMIZAÇÃO: Executar queries em paralelo
      const [workingHoursResult, timeOffResult, specificAvailabilityResult, existingAppointmentsResult] = await Promise.all([
        // 1. Buscar horário de trabalho
        supabase
          .from('working_hours')
          .select('start_time, end_time')
          .eq('staff_id', staffTableId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .maybeSingle(),
        
        // 2. Verificar folgas programadas (time_off)
        supabase
          .from('time_off')
          .select('id, type')
          .eq('barber_id', barberId)
          .eq('status', 'ativo')
          .lte('start_date', dateStr)
          .gte('end_date', dateStr)
          .maybeSingle(),
        
        // 3. Verificar disponibilidade específica (bloqueios)
        supabase
          .from('barber_availability')
          .select('is_available, start_time, end_time')
          .eq('barber_id', barberId)
          .eq('date', dateStr)
          .maybeSingle(),
        
        // 4. Buscar agendamentos existentes
        supabase
          .from('painel_agendamentos')
          .select('hora, servico:painel_servicos(duracao)')
          .eq('barbeiro_id', barberId)
          .eq('data', dateStr)
          .not('status', 'in', '("cancelado","ausente")')
      ]);

      const workingHours = workingHoursResult.data;
      const timeOff = timeOffResult.data;
      const specificAvailability = specificAvailabilityResult.data;
      const existingAppointments = existingAppointmentsResult.data;

      if (!workingHours) {
        console.log('⚠️ [getAvailableTimeSlots] Nenhum horário de trabalho para staff_id:', staffTableId, 'dia:', dayOfWeek);
        return [];
      }

      // Verificar folga programada
      if (timeOff) {
        console.log('⚠️ [getAvailableTimeSlots] Barbeiro em folga neste dia');
        return []; // Barbeiro em folga
      }

      if (specificAvailability?.is_available === false) {
        console.log('⚠️ [getAvailableTimeSlots] Barbeiro não disponível neste dia');
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

      console.log('✅ [getAvailableTimeSlots] Slots gerados:', slots.filter(s => s.available).length, 'disponíveis de', slots.length);
      return slots;
    } catch (error) {
      console.error('❌ [getAvailableTimeSlots] Erro:', error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [formatDateLocal, isDateToday, timeToMinutes, minutesToTime, resolveStaffId]);

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
