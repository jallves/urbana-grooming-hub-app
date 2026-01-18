import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, addMinutes, parse } from 'date-fns';
import { BUFFER_MINUTES } from '@/lib/utils/timeCalculations';

interface TimeSlot {
  time: string;
  available: boolean;
}

/**
 * Hook otimizado para buscar horários disponíveis de um barbeiro
 * OTIMIZADO: Queries em paralelo para melhor performance
 */
export const useBarberAvailableSlots = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  /**
   * Resolve o staff_id correto para queries de working_hours
   */
  const resolveStaffId = async (barberId: string): Promise<string> => {
    // Buscar o staff_id do barbeiro na tabela painel_barbeiros
    const { data: barberData } = await supabase
      .from('painel_barbeiros')
      .select('staff_id')
      .eq('id', barberId)
      .maybeSingle();

    const authStaffId = barberData?.staff_id || barberId;

    // Resolver o ID correto da tabela staff
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id')
      .eq('staff_id', authStaffId)
      .maybeSingle();

    return staffRecord?.id || authStaffId;
  };

  const fetchAvailableSlots = useCallback(async (
    barberId: string,
    date: Date,
    serviceDuration: number,
    excludeAppointmentId?: string
  ) => {
    setLoading(true);
    console.log('🕐 [BarberSlots] Buscando slots:', {
      barberId,
      date: format(date, 'yyyy-MM-dd'),
      serviceDuration,
      excludeAppointmentId
    });
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isCurrentDay = isToday(date);
      
      // Resolver staff_id primeiro
      const staffTableId = await resolveStaffId(barberId);
      console.log('🔗 [BarberSlots] Staff ID resolvido:', staffTableId);

      // OTIMIZAÇÃO: Queries em paralelo
      const [workingHoursResult, appointmentsResult] = await Promise.all([
        // Buscar horários de trabalho
        supabase
          .from('working_hours')
          .select('start_time, end_time')
          .eq('staff_id', staffTableId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .maybeSingle(),
        
        // Buscar agendamentos existentes
        supabase
          .from('painel_agendamentos')
          .select('id, hora, servico:painel_servicos(duracao)')
          .eq('barbeiro_id', barberId)
          .eq('data', formattedDate)
          .neq('status', 'cancelado')
      ]);

      const workingHours = workingHoursResult.data;
      const appointments = appointmentsResult.data;

      if (!workingHours) {
        console.log('❌ [BarberSlots] Sem horário de trabalho para este dia');
        setSlots([]);
        return;
      }

      const occupiedSlots = new Set<string>();
      
      // Marcar todos os slots ocupados considerando a duração e buffer
      appointments?.forEach((apt) => {
        // Ignorar o agendamento sendo editado
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return;
        
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const aptStart = parse(apt.hora, 'HH:mm:ss', new Date());
        
        // Adicionar buffer de 10 minutos
        const totalDuration = aptDuration + BUFFER_MINUTES;
        
        for (let i = 0; i < totalDuration; i += 30) {
          const slot = format(addMinutes(aptStart, i), 'HH:mm');
          occupiedSlots.add(slot);
        }
      });

      // Gerar slots
      const allSlots: TimeSlot[] = [];
      const startHour = parseInt(workingHours.start_time.split(':')[0]);
      const endHour = parseInt(workingHours.end_time.split(':')[0]);
      const endMinute = parseInt(workingHours.end_time.split(':')[1]) || 0;

      for (let hour = startHour; hour < endHour || (hour === endHour && endMinute > 0); hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se excede horário de trabalho
          const slotEndTime = format(
            addMinutes(parse(timeString, 'HH:mm', new Date()), serviceDuration),
            'HH:mm'
          );
          
          if (slotEndTime > workingHours.end_time) {
            continue;
          }

          // Se for hoje, verificar se já passou (com 30 min de antecedência)
          let isPast = false;
          if (isCurrentDay) {
            const slotTotalMinutes = hour * 60 + minute;
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            if (slotTotalMinutes <= currentTotalMinutes + 30) {
              isPast = true;
            }
          }

          const isOccupied = occupiedSlots.has(timeString);
          
          allSlots.push({
            time: timeString,
            available: !isOccupied && !isPast
          });
        }
      }

      const availableCount = allSlots.filter(s => s.available).length;
      console.log('✅ [BarberSlots] Slots disponíveis:', availableCount, 'de', allSlots.length);

      setSlots(allSlots);
    } catch (error) {
      console.error('❌ [BarberSlots] Erro ao buscar horários disponíveis:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    slots,
    loading,
    fetchAvailableSlots
  };
};