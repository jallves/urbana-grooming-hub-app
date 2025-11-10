import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, parse, startOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';

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
    const now = new Date();
    const today = startOfDay(now);
    const selectedDay = startOfDay(date);
    
    // Se não é hoje, sempre válido
    if (selectedDay.getTime() !== today.getTime()) {
      return { valid: true };
    }

    // Extrair hora e minuto
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Adicionar 30 minutos de margem para preparação
    const minTime = addMinutes(now, 30);

    if (isBefore(selectedDateTime, minTime)) {
      return {
        valid: false,
        error: 'Este horário já passou ou está muito próximo. Escolha um horário com pelo menos 30 minutos de antecedência.'
      };
    }

    return { valid: true };
  }, []);

  /**
   * Verifica se há conflito com agendamentos existentes
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
      const [hours, minutes] = time.split(':').map(Number);
      
      // Calcular horário de fim
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + serviceDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      console.log('🔍 Verificando conflitos:', {
        barberId,
        dateStr,
        time,
        endTime,
        serviceDuration
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

      // Verificar cada agendamento para conflitos
      for (const apt of appointments) {
        const aptTime = apt.hora;
        const aptDuration = (apt.servico as any)?.duracao || 60;
        
        const [aptHours, aptMinutes] = aptTime.split(':').map(Number);
        const aptStartMinutes = aptHours * 60 + aptMinutes;
        const aptEndMinutes = aptStartMinutes + aptDuration;
        
        // Verificar sobreposição
        // Caso 1: Novo agendamento começa durante um existente
        const startsInside = startMinutes >= aptStartMinutes && startMinutes < aptEndMinutes;
        // Caso 2: Novo agendamento termina durante um existente
        const endsInside = endMinutes > aptStartMinutes && endMinutes <= aptEndMinutes;
        // Caso 3: Novo agendamento engloba um existente
        const englobes = startMinutes <= aptStartMinutes && endMinutes >= aptEndMinutes;

        if (startsInside || endsInside || englobes) {
          console.log('⚠️ Conflito encontrado:', {
            existingStart: aptTime,
            existingDuration: aptDuration,
            requestedStart: time,
            requestedDuration: serviceDuration
          });

          return {
            valid: false,
            error: `Este horário conflita com um agendamento às ${aptTime}. Por favor, escolha outro horário.`
          };
        }
      }

      console.log('✅ Nenhum conflito encontrado');
      return { valid: true };
    } catch (error) {
      console.error('💥 Erro na verificação de conflitos:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade' };
    }
  }, []);

  /**
   * Verifica horário de funcionamento
   */
  const checkBusinessHours = useCallback((time: string): ValidationResult => {
    const [hours] = time.split(':').map(Number);
    
    // Horário de funcionamento: 8h às 20h
    if (hours < 8 || hours >= 20) {
      return {
        valid: false,
        error: 'Nosso horário de funcionamento é das 08:00 às 20:00.'
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

      // 1. Validar horário de funcionamento
      const businessHoursCheck = checkBusinessHours(time);
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
      const now = new Date();

      console.log('🔍 getAvailableTimeSlots:', {
        dateStr,
        today,
        isToday,
        currentTime: format(now, 'HH:mm:ss'),
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

      // Marcar slots ocupados
      const occupiedSlots = new Set<string>();
      
      appointments?.forEach((apt) => {
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const [aptHours, aptMinutes] = apt.hora.split(':').map(Number);
        
        // Marcar todos os slots de 30 minutos que o agendamento ocupa
        for (let i = 0; i < aptDuration; i += 30) {
          const occupiedMinutes = aptHours * 60 + aptMinutes + i;
          const occupiedHour = Math.floor(occupiedMinutes / 60);
          const occupiedMinute = occupiedMinutes % 60;
          const slot = `${occupiedHour.toString().padStart(2, '0')}:${occupiedMinute.toString().padStart(2, '0')}`;
          occupiedSlots.add(slot);
        }
      });

      // Gerar slots de 8h às 20h (intervalos de 30 min)
      const slots: TimeSlot[] = [];
      
      for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se o serviço cabe antes do fechamento
          const serviceEndMinutes = hour * 60 + minute + serviceDuration;
          const serviceEndHour = Math.floor(serviceEndMinutes / 60);
          if (serviceEndHour > 20 || (serviceEndHour === 20 && serviceEndMinutes % 60 > 0)) {
            continue;
          }

          let available = true;
          let reason: string | undefined;

          // Se for hoje, verificar se já passou (com buffer de 30 min)
          if (isToday) {
            const slotDateTime = new Date(date);
            slotDateTime.setHours(hour, minute, 0, 0);
            
            // Buffer de 30 minutos
            const minDateTime = addMinutes(now, 30);
            
            if (isBefore(slotDateTime, minDateTime)) {
              available = false;
              reason = 'Horário já passou';
              
              console.log('⏰ Horário filtrado:', {
                time: timeString,
                slotDateTime: format(slotDateTime, 'HH:mm:ss'),
                minDateTime: format(minDateTime, 'HH:mm:ss'),
                reason: 'já passou ou < 30min'
              });
            }
          }

          // Verificar se está ocupado
          if (available && occupiedSlots.has(timeString)) {
            available = false;
            reason = 'Horário ocupado';
          }

          slots.push({
            time: timeString,
            available,
            reason
          });
        }
      }

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
