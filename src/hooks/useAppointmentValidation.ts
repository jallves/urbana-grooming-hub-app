import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, parse, startOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { 
  hasTimeOverlap, 
  isWithinBusinessHours, 
  isPastTime,
  getOccupiedSlots,
  calculateEndTimeWithBuffer,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  BUFFER_MINUTES,
  timeToMinutes,
  minutesToTime
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
 * Valida:
 * - Horários passados (dia atual)
 * - Conflitos de horário
 * - Disponibilidade do barbeiro
 * - Horário de funcionamento
 */
export const useAppointmentValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Extrai mensagem de erro amigável do banco de dados
   */
  const extractDatabaseError = useCallback((error: any): string => {
    if (!error?.message) return 'Erro ao processar agendamento';
    
    const message = error.message;
    
    // Erros de conflito de horário
    if (message.includes('Conflito de horário')) {
      const match = message.match(/às (\d{2}:\d{2})/);
      if (match) {
        return `Este horário conflita com um agendamento às ${match[1]}. Escolha outro horário.`;
      }
      return 'Este horário já está ocupado. Escolha outro horário.';
    }
    
    // Erros de horário passado
    if (message.includes('mais de 10 minutos') || message.includes('30 minutos de antecedência')) {
      return 'Este horário não está mais disponível. Já passaram mais de 10 minutos desde o horário agendado.';
    }
    
    // Erros de horário de funcionamento
    if (message.includes('Horário fora do expediente')) {
      return 'Horário de funcionamento: Segunda a Sábado 08:00-20:00, Domingo 09:00-13:00.';
    }
    
    if (message.includes('intervalos de 30 minutos')) {
      return 'Agendamentos devem ser feitos em intervalos de 30 minutos (XX:00 ou XX:30).';
    }
    
    // Erros de data
    if (message.includes('datas passadas')) {
      return 'Não é possível agendar para datas passadas.';
    }
    
    if (message.includes('60 dias de antecedência')) {
      return 'Agendamentos podem ser feitos com até 60 dias de antecedência.';
    }
    
    // Erro genérico
    return 'Não foi possível realizar o agendamento. Tente novamente.';
  }, []);

  /**
   * Valida se o horário não é passado (apenas para o dia atual)
   */
  const validateNotPastTime = useCallback((date: Date, time: string): ValidationResult => {
    if (isPastTime(date, time)) {
      return {
        valid: false,
        error: 'Este horário não está mais disponível. Já passaram mais de 10 minutos desde o horário agendado.'
      };
    }
    return { valid: true };
  }, []);

  /**
   * Verifica se há conflito com agendamentos existentes
   * IMPORTANTE: Usa função unificada que verifica TODOS os sistemas
   */
  const checkAppointmentConflict = useCallback(async (
    staffId: string,
    date: Date,
    time: string,
    serviceDuration: number = 60,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      const { data: isAvailable, error: rpcError } = await supabase.rpc('check_unified_slot_availability', {
        p_staff_id: staffId,
        p_date: dateStr,
        p_time: time,
        p_duration_minutes: serviceDuration,
        p_exclude_appointment_id: excludeAppointmentId || null
      });

      if (rpcError) {
        console.error('❌ Erro ao verificar disponibilidade:', rpcError);
        return { valid: false, error: 'Erro ao verificar disponibilidade' };
      }

      if (!isAvailable) {
        return { valid: false, error: `Horário ${time} não está disponível.` };
      }

      console.log('✅ Horário disponível (validação unificada)');
      return { valid: true };
    } catch (error) {
      console.error('💥 Erro na verificação de conflitos:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade' };
    }
  }, []);

  /**
   * Verifica horário de funcionamento
   * Considera que o serviço precisa terminar antes do fechamento
   */
  const checkBusinessHours = useCallback((time: string, serviceDuration: number = 60): ValidationResult => {
    if (!isWithinBusinessHours(time, serviceDuration)) {
      return {
        valid: false,
        error: `Nosso horário de funcionamento é das ${BUSINESS_START_HOUR}:00 às ${BUSINESS_END_HOUR}:00. Este serviço não pode ser concluído dentro do expediente.`
      };
    }
    return { valid: true };
  }, []);

  /**
   * Validação completa antes de criar/atualizar agendamento
   * IMPORTANTE: A RPC check_unified_slot_availability já valida:
   * - Horário de funcionamento (working_hours do banco)
   * - Conflitos com outros agendamentos
   * - Disponibilidade do barbeiro
   * 
   * Removemos a validação de horário hardcoded do frontend para evitar
   * conflitos com os horários reais configurados no banco.
   */
  const validateAppointment = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number = 60,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      console.log('🔐 Iniciando validação completa:', {
        barberId,
        date: format(date, 'yyyy-MM-dd'),
        time,
        serviceDuration,
        excludeAppointmentId
      });

      // 1. Validar se não é horário passado (para dia atual)
      const pastTimeCheck = validateNotPastTime(date, time);
      if (!pastTimeCheck.valid) {
        console.error('❌ Horário passado detectado');
        toast.error(pastTimeCheck.error);
        return pastTimeCheck;
      }

      // 2. Verificar disponibilidade usando RPC unificada
      // Esta RPC JÁ valida:
      // - Horário de trabalho do barbeiro (working_hours)
      // - Conflitos com agendamentos existentes
      // - Se o serviço pode ser concluído no horário de trabalho
      const conflictCheck = await checkAppointmentConflict(
        barberId,
        date,
        time,
        serviceDuration,
        excludeAppointmentId
      );
      
      if (!conflictCheck.valid) {
        console.error('❌ Conflito de horário detectado');
        toast.error(conflictCheck.error);
        return conflictCheck;
      }

      console.log('✅ Validação completa bem-sucedida');
      return { valid: true };
    } catch (error) {
      console.error('💥 Erro na validação completa:', error);
      const errorMsg = 'Erro ao validar agendamento. Tente novamente.';
      toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsValidating(false);
    }
  }, [validateNotPastTime, checkAppointmentConflict]);

  /**
   * Busca horários disponíveis para um barbeiro em uma data específica
   * IMPORTANTE: Usa função unificada do banco que verifica TODOS os sistemas (Totem, Painel Cliente, Painel Admin)
   */
  const getAvailableTimeSlots = useCallback(async (
    staffId: string,
    date: Date,
    serviceDuration: number = 60
  ): Promise<TimeSlot[]> => {
    setIsValidating(true);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = dateStr === today;
      
      // Usar horário local do Brasil (não UTC)
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      console.log('🔍 getAvailableTimeSlots (OTIMIZADO):', {
        dateStr,
        today,
        isToday,
        currentTime: `${currentHour}:${currentMinute}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        staffId,
        serviceDuration,
        note: 'Usando get_available_time_slots_optimized - busca todos os slots de uma vez'
      });

      // Buscar todos os slots disponíveis de uma vez usando função RPC otimizada
      const { data: slotsData, error: rpcError } = await supabase.rpc('get_available_time_slots_optimized', {
        p_staff_id: staffId,
        p_date: dateStr,
        p_service_duration: serviceDuration
      });

      if (rpcError) {
        console.error('❌ Erro ao buscar slots:', rpcError);
        throw rpcError;
      }

      // Converter dados do banco para o formato TimeSlot
      const slots: TimeSlot[] = (slotsData || []).map((slot: any) => {
        const timeString = slot.time_slot;
        let available = slot.is_available;
        let reason: string | undefined;

        // Se for hoje, verificar se passou há mais de 10 minutos
        if (isToday && isPastTime(date, timeString)) {
          console.log(`🕐 Horário ${timeString} marcado como passado (> 10min)`);
          available = false;
          reason = 'Passou há mais de 10min';
        } else if (!available) {
          console.log(`❌ Horário ${timeString} ocupado (RPC retornou indisponível)`);
          reason = 'Horário ocupado';
        } else {
          console.log(`✅ Horário ${timeString} disponível`);
        }

        return {
          time: timeString,
          available,
          reason
        };
      });

      console.log(`📊 Total de slots retornados: ${slots.length}, Disponíveis: ${slots.filter(s => s.available).length}`);

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
