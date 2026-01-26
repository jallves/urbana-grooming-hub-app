import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, parse } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const useAvailabilityCheck = () => {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Verifica se o barbeiro trabalha no dia/horário especificado
   */
  const checkWorkingHours = useCallback(async (
    barberId: string,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<{ valid: boolean; error?: string }> => {
    const dayOfWeek = date.getDay();
    const endTime = format(
      addMinutes(parse(startTime, 'HH:mm', new Date()), duration),
      'HH:mm'
    );

    const { data: workingHours, error } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_active')
      .eq('staff_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return { valid: false, error: 'Erro ao verificar horário de trabalho' };
    }

    if (!workingHours) {
      return { valid: false, error: 'Barbeiro não trabalha neste dia' };
    }

    // Verificar se o horário está dentro do expediente
    if (startTime < workingHours.start_time || endTime > workingHours.end_time) {
      return { 
        valid: false, 
        error: `Horário fora do expediente (${workingHours.start_time} - ${workingHours.end_time})` 
      };
    }

    return { valid: true };
  }, []);

  /**
   * Verifica conflitos com agendamentos existentes
   */
  const checkAppointmentConflicts = useCallback(async (
    barberId: string,
    date: Date,
    startTime: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<{ valid: boolean; error?: string }> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const endTime = format(
      addMinutes(parse(startTime, 'HH:mm', new Date()), duration),
      'HH:mm'
    );

    let query = supabase
      .from('painel_agendamentos')
      .select('id, hora, servico:painel_servicos(duracao)')
      .eq('barbeiro_id', barberId)
      .eq('data', dateStr)
      .neq('status', 'cancelado');

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return { valid: false, error: 'Erro ao verificar conflitos' };
    }

    if (!appointments || appointments.length === 0) {
      return { valid: true };
    }

    // Verificar sobreposição de horários
    for (const apt of appointments) {
      const aptStartTime = apt.hora;
      const aptDuration = (apt.servico as any)?.duracao || 60;
      const aptEndTime = format(
        addMinutes(parse(aptStartTime, 'HH:mm', new Date()), aptDuration),
        'HH:mm'
      );

      // Verificar se há sobreposição
      const hasOverlap = 
        (startTime >= aptStartTime && startTime < aptEndTime) ||
        (endTime > aptStartTime && endTime <= aptEndTime) ||
        (startTime <= aptStartTime && endTime >= aptEndTime);

      if (hasOverlap) {
        return { 
          valid: false, 
          error: `Conflito com agendamento às ${aptStartTime}` 
        };
      }
    }

    return { valid: true };
  }, []);

  /**
   * Verifica disponibilidade específica (folgas/bloqueios)
   */
  const checkSpecificAvailability = useCallback(async (
    barberId: string,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<{ valid: boolean; error?: string }> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const endTime = format(
      addMinutes(parse(startTime, 'HH:mm', new Date()), duration),
      'HH:mm'
    );

    // Buscar TODOS os registros de disponibilidade para o dia (pode haver múltiplos slots bloqueados)
    const { data: availabilityRecords, error } = await supabase
      .from('barber_availability')
      .select('is_available, start_time, end_time')
      .eq('barber_id', barberId)
      .eq('date', dateStr);

    if (error) {
      return { valid: false, error: 'Erro ao verificar disponibilidade específica' };
    }

    if (!availabilityRecords || availabilityRecords.length === 0) {
      return { valid: true }; // Sem registro específico = disponível
    }

    // Converter horários para minutos para comparação
    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Verificar se algum bloqueio afeta o horário solicitado
    for (const availability of availabilityRecords) {
      if (!availability.is_available) {
        const blockStart = timeToMinutes(availability.start_time);
        const blockEnd = timeToMinutes(availability.end_time);
        
        // Verifica sobreposição
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
      if (startTime < specificAvailability.start_time || endTime > specificAvailability.end_time) {
        return { 
          valid: false, 
          error: `Disponível apenas entre ${specificAvailability.start_time.substring(0, 5)} - ${specificAvailability.end_time.substring(0, 5)}` 
        };
      }
    }

    return { valid: true };
  }, []);

  /**
   * Verificação completa de disponibilidade
   */
  const checkAvailability = useCallback(async (
    barberId: string,
    date: Date,
    startTime: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<{ valid: boolean; error?: string }> => {
    setIsChecking(true);

    try {
      // 1. Verificar horário de trabalho
      const workingHoursCheck = await checkWorkingHours(barberId, date, startTime, duration);
      if (!workingHoursCheck.valid) {
        return workingHoursCheck;
      }

      // 2. Verificar conflitos com outros agendamentos
      const conflictsCheck = await checkAppointmentConflicts(
        barberId, 
        date, 
        startTime, 
        duration, 
        excludeAppointmentId
      );
      if (!conflictsCheck.valid) {
        return conflictsCheck;
      }

      // 3. Verificar disponibilidade específica
      const specificCheck = await checkSpecificAvailability(barberId, date, startTime, duration);
      if (!specificCheck.valid) {
        return specificCheck;
      }

      return { valid: true };
    } catch (error) {
      console.error('Erro na verificação de disponibilidade:', error);
      return { valid: false, error: 'Erro ao verificar disponibilidade' };
    } finally {
      setIsChecking(false);
    }
  }, [checkWorkingHours, checkAppointmentConflicts, checkSpecificAvailability]);

  /**
   * Busca todos os horários disponíveis para uma data
   */
  const getAvailableTimeSlots = useCallback(async (
    barberId: string,
    date: Date,
    duration: number
  ): Promise<TimeSlot[]> => {
    setIsChecking(true);

    try {
      const dayOfWeek = date.getDay();
      const dateStr = format(date, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = dateStr === today;
      const now = new Date();

      // Buscar horário de trabalho
      const { data: workingHours, error: whError } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (whError || !workingHours) {
        return [];
      }

      // Buscar agendamentos existentes
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select('hora, servico:painel_servicos(duracao)')
        .eq('barbeiro_id', barberId)
        .eq('data', dateStr)
        .neq('status', 'cancelado');

      const occupiedSlots = new Set<string>();
      
      // Marcar todos os slots ocupados considerando a duração
      appointments?.forEach((apt) => {
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const aptStart = parse(apt.hora, 'HH:mm', new Date());
        
        // Marcar slot inicial e próximos baseado na duração
        for (let i = 0; i < aptDuration; i += 30) {
          const slot = format(addMinutes(aptStart, i), 'HH:mm');
          occupiedSlots.add(slot);
        }
      });

      // Gerar slots disponíveis
      const slots: TimeSlot[] = [];
      const startHour = parseInt(workingHours.start_time.split(':')[0]);
      const endHour = parseInt(workingHours.end_time.split(':')[0]);
      const endMinute = parseInt(workingHours.end_time.split(':')[1]);

      for (let hour = startHour; hour < endHour || (hour === endHour && endMinute > 0); hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se excede horário de trabalho
          const slotEndTime = format(
            addMinutes(parse(timeString, 'HH:mm', new Date()), duration),
            'HH:mm'
          );
          
          if (slotEndTime > workingHours.end_time) {
            continue;
          }

          // Se for hoje, verificar se já passou
          let isPast = false;
          if (isToday) {
            const slotTime = parse(timeString, 'HH:mm', new Date());
            if (slotTime <= now) {
              isPast = true;
            }
          }

          const isOccupied = occupiedSlots.has(timeString);
          
          slots.push({
            time: timeString,
            available: !isOccupied && !isPast,
            reason: isPast ? 'Horário já passou' : (isOccupied ? 'Horário ocupado' : undefined)
          });
        }
      }

      return slots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isChecking,
    checkAvailability,
    getAvailableTimeSlots,
    checkWorkingHours,
    checkAppointmentConflicts,
    checkSpecificAvailability
  };
};