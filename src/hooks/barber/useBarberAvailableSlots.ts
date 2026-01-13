import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, addMinutes, parse } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
}

export const useBarberAvailableSlots = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

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
      
      // Primeiro, determinar qual tipo de ID foi recebido
      let painelBarbeiroId = barberId;
      
      // Verificar se é um painel_barbeiros.id válido
      const { data: barbeiroCheck } = await supabase
        .from('painel_barbeiros')
        .select('id, staff_id')
        .eq('id', barberId)
        .maybeSingle();
      
      if (!barbeiroCheck) {
        // Não é painel_barbeiros.id, pode ser staff_id
        const { data: barbeiroByStaff } = await supabase
          .from('painel_barbeiros')
          .select('id, staff_id')
          .eq('staff_id', barberId)
          .maybeSingle();
          
        if (barbeiroByStaff) {
          painelBarbeiroId = barbeiroByStaff.id;
          console.log('🔄 [BarberSlots] Convertido staff_id para painel_barbeiros.id:', painelBarbeiroId);
        }
      }

      console.log('🔍 [BarberSlots] Usando painel_barbeiros.id:', painelBarbeiroId);

      // Buscar horários de trabalho
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', barbeiroCheck?.staff_id || barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (!workingHours) {
        console.log('❌ [BarberSlots] Sem horário de trabalho para este dia');
        setSlots([]);
        return;
      }

      // Buscar agendamentos existentes
      const { data: appointments } = await supabase
        .from('painel_agendamentos')
        .select('hora, servico:painel_servicos(duracao)')
        .eq('barbeiro_id', painelBarbeiroId)
        .eq('data', formattedDate)
        .neq('status', 'cancelado');

      const occupiedSlots = new Set<string>();
      
      // Marcar todos os slots ocupados considerando a duração
      appointments?.forEach((apt) => {
        const aptDuration = (apt.servico as any)?.duracao || 60;
        const aptStart = parse(apt.hora, 'HH:mm:ss', new Date());
        
        for (let i = 0; i < aptDuration; i += 30) {
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

          // Se for hoje, verificar se já passou
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