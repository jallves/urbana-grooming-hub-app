import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';

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
      
      // Primeiro, determinar qual tipo de ID foi recebido
      // Tentar como painel_barbeiros.id primeiro
      let painelBarbeiroId = barberId;
      
      // Verificar se é um painel_barbeiros.id válido
      const { data: barbeiroCheck } = await supabase
        .from('painel_barbeiros')
        .select('id, staff_id')
        .eq('id', barberId)
        .maybeSingle();
      
      if (!barbeiroCheck) {
        // Não é painel_barbeiros.id, pode ser staff_id
        // Tentar buscar painel_barbeiros por staff_id
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

      // Usar a RPC get_barbeiro_horarios_disponiveis que espera painel_barbeiros.id
      const { data: slotsData, error } = await supabase.rpc('get_barbeiro_horarios_disponiveis', {
        p_barbeiro_id: painelBarbeiroId,
        p_data: formattedDate,
        p_duracao_minutos: serviceDuration
      });

      if (error) {
        console.error('❌ [BarberSlots] Erro ao buscar slots:', error);
        setSlots([]);
        return;
      }

      // Converter dados do banco para o formato TimeSlot
      const slotsWithAvailability: TimeSlot[] = (slotsData || []).map((slot: any) => ({
        time: typeof slot.horario === 'string' ? slot.horario.substring(0, 5) : slot.horario,
        available: slot.disponivel
      }));

      const availableCount = slotsWithAvailability.filter(s => s.available).length;
      console.log('✅ [BarberSlots] Slots disponíveis:', availableCount, 'de', slotsWithAvailability.length);

      setSlots(slotsWithAvailability);
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
