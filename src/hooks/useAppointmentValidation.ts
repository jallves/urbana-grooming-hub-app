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
    if (message.includes('30 minutos de antecedência')) {
      return 'Este horário já passou ou está muito próximo. Escolha um horário com pelo menos 30 minutos de antecedência.';
    }
    
    // Erros de horário de funcionamento
    if (message.includes('Horário fora do expediente')) {
      return 'Nosso horário de funcionamento é das 08:00 às 20:00.';
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
        error: 'Este horário já passou ou está muito próximo. Escolha um horário com pelo menos 30 minutos de antecedência.'
      };
    }
    return { valid: true };
  }, []);

  /**
   * Verifica se há conflito com agendamentos existentes
   * IMPORTANTE: Considera buffer de 10 minutos entre agendamentos
   */
  const checkAppointmentConflict = useCallback(async (
    barberId: string,
    date: Date,
    time: string,
    serviceDuration: number = 60,
    excludeAppointmentId?: string
  ): Promise<ValidationResult> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const endTimeWithBuffer = calculateEndTimeWithBuffer(time, serviceDuration);

      console.log('🔍 Verificando conflitos com buffer de 10min:', {
        barberId,
        dateStr,
        startTime: time,
        serviceDuration,
        endTimeWithBuffer,
        buffer: `${BUFFER_MINUTES}min`
      });

      // Buscar agendamentos do barbeiro nesta data (exceto cancelados)
      let query = supabase
        .from('painel_agendamentos')
        .select(`
          id,
          hora,
          servico:painel_servicos(duracao)
        `)
        .eq('barbeiro_id', barberId)
        .eq('data', dateStr)
        .neq('status', 'cancelado');

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        return { valid: false, error: 'Erro ao verificar disponibilidade' };
      }

      if (!appointments || appointments.length === 0) {
        console.log('✅ Nenhum agendamento encontrado - disponível');
        return { valid: true };
      }

      // Verificar cada agendamento para conflitos (com buffer)
      for (const apt of appointments) {
        const aptTime = apt.hora;
        const aptDuration = (apt.servico as any)?.duracao || 60;
        
        // Usar função que considera o buffer de 10 minutos
        if (hasTimeOverlap(time, serviceDuration, aptTime, aptDuration)) {
          const aptEndWithBuffer = calculateEndTimeWithBuffer(aptTime, aptDuration);
          
          console.log('⚠️ Conflito encontrado (com buffer):', {
            existingStart: aptTime,
            existingDuration: aptDuration,
            existingEndWithBuffer: aptEndWithBuffer,
            requestedStart: time,
            requestedDuration: serviceDuration,
            requestedEndWithBuffer: endTimeWithBuffer
          });

          return {
            valid: false,
            error: `Este horário conflita com um agendamento às ${aptTime}. Próximo horário disponível: ${aptEndWithBuffer}.`
          };
        }
      }

      console.log('✅ Nenhum conflito encontrado (buffer validado)');
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

      // 1. Validar horário de funcionamento (considerando duração do serviço)
      const businessHoursCheck = checkBusinessHours(time, serviceDuration);
      if (!businessHoursCheck.valid) {
        toast.error(businessHoursCheck.error);
        return businessHoursCheck;
      }

      // 2. Validar se não é horário passado (para dia atual)
      const pastTimeCheck = validateNotPastTime(date, time);
      if (!pastTimeCheck.valid) {
        toast.error(pastTimeCheck.error);
        return pastTimeCheck;
      }

      // 3. Verificar conflitos de horário
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
  }, [checkBusinessHours, validateNotPastTime, checkAppointmentConflict]);

  /**
   * Busca horários disponíveis para uma data específica
   */
  const getAvailableTimeSlots = useCallback(async (
    barberId: string,
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
      
      console.log('🔍 getAvailableTimeSlots:', {
        dateStr,
        today,
        isToday,
        currentTime: `${currentHour}:${currentMinute}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        barberId,
        serviceDuration
      });

      // Buscar agendamentos existentes
      const { data: appointments, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          hora,
          servico:painel_servicos(duracao)
        `)
        .eq('barbeiro_id', barberId)
        .eq('data', dateStr)
        .neq('status', 'cancelado');

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
      }

      // Marcar slots ocupados (INCLUINDO BUFFER DE 10 MINUTOS)
      const occupiedSlots = new Set<string>();
      
      appointments?.forEach((apt) => {
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const aptTime = apt.hora;
        
        // Usar função que calcula slots ocupados com buffer
        const slots = getOccupiedSlots(aptTime, aptDuration);
        slots.forEach(slot => occupiedSlots.add(slot));
        
        console.log(`📅 Agendamento ${aptTime} (${aptDuration}min) ocupa slots:`, slots);
      });

      console.log('🔒 Total de slots ocupados:', Array.from(occupiedSlots));

      // Gerar slots (horário de funcionamento configurável)
      const slots: TimeSlot[] = [];
      
      for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se o serviço cabe antes do fechamento (SEM buffer, apenas o serviço)
          if (!isWithinBusinessHours(timeString, serviceDuration)) {
            continue;
          }

          let available = true;
          let reason: string | undefined;

          // Se for hoje, verificar se já passou (com buffer de 30 min)
          if (isToday && isPastTime(date, timeString)) {
            available = false;
            reason = 'Horário já passou ou < 30min';
          }

          // Verificar se está ocupado (já considera buffer de 10min)
          if (available && occupiedSlots.has(timeString)) {
            available = false;
            reason = 'Horário ocupado (inclui buffer de 10min)';
          }

          slots.push({
            time: timeString,
            available,
            reason
          });
        }
      }

      console.log(`📊 Total de slots gerados: ${slots.length}, Disponíveis: ${slots.filter(s => s.available).length}`);

      return slots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
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
