
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarberAvailabilityInfo } from './types';

export const useAvailability = () => {
  const { toast } = useToast();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const fetchAvailableTimes = useCallback(async (date: Date, serviceId: string) => {
    if (!date || !serviceId) {
      setAvailableTimes([]);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      // Buscar duração do serviço
      const { data: serviceData } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .single();

      if (!serviceData) {
        setAvailableTimes([]);
        return;
      }

      // Buscar barbeiros ativos
      const { data: activeBarbers } = await supabase
        .from('staff')
        .select('id')
        .eq('is_active', true)
        .eq('role', 'barber');

      if (!activeBarbers || activeBarbers.length === 0) {
        setAvailableTimes([]);
        return;
      }

      // Coletar todos os slots disponíveis de todos os barbeiros
      const allSlots = new Set<string>();

      for (const barber of activeBarbers) {
        const { data: slots } = await supabase.rpc('get_available_time_slots', {
          p_staff_id: barber.id,
          p_date: date.toISOString().split('T')[0],
          p_service_duration: serviceData.duration
        });

        if (slots) {
          slots.forEach((slot: any) => allSlots.add(slot.time_slot));
        }
      }

      // Converter para array e ordenar
      const timeSlots = Array.from(allSlots).sort();
      setAvailableTimes(timeSlots);
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [toast]);

  const checkBarberAvailability = useCallback(
    async (date: Date, time: string, serviceId: string, externalBarbers?: any[]) => {
      if (!date || !time || !serviceId) {
        setBarberAvailability([]);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        console.log("Verificando disponibilidade dos barbeiros para:", {
          date,
          time,
          serviceId,
          externalBarbers,
        });

        let staffMembers: any[] = [];

        if (Array.isArray(externalBarbers) && externalBarbers.length > 0) {
          staffMembers = externalBarbers;
          console.log("[useAvailability] Usando array externo de barbeiros:", staffMembers);
        } else {
          // Fallback: busca direto do banco
          const { data: dbStaff, error: staffError } = await supabase
            .from("staff")
            .select("id, name, is_active, role")
            .eq("is_active", true)
            .eq("role", "barber")
            .order("name", { ascending: true });

          if (staffError || !dbStaff || dbStaff.length === 0) {
            console.error("Erro ao buscar barbeiros ativos no fallback:", staffError);
            toast({
              title: "Erro",
              description: "Não foi possível verificar a disponibilidade dos barbeiros.",
              variant: "destructive",
            });
            setBarberAvailability([]);
            setIsCheckingAvailability(false);
            return;
          }
          staffMembers = dbStaff;
          console.log("[useAvailability] Usando array de barbeiros buscado do banco (fallback):", staffMembers);
        }

        // Buscar duração do serviço
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("duration")
          .eq("id", serviceId)
          .single();

        let serviceDuration = 60;
        if (!serviceError && serviceData) serviceDuration = serviceData.duration;

        // Verificar disponibilidade para cada barbeiro usando a função SQL
        const availability = await Promise.all(
          staffMembers.map(async (staff) => {
            try {
              const { data: isAvailable } = await supabase.rpc('check_barber_availability', {
                p_barber_id: staff.id,
                p_date: date.toISOString().split('T')[0],
                p_start_time: time,
                p_duration_minutes: serviceDuration
              });

              return {
                id: staff.id,
                name: staff.name,
                available: Boolean(isAvailable),
              };
            } catch (error) {
              console.error(`Erro ao verificar disponibilidade para ${staff.name}:`, error);
              return { id: staff.id, name: staff.name, available: false };
            }
          })
        );

        setBarberAvailability(availability);
        console.log("[useAvailability] Resultado verificação:", availability);
      } catch (error) {
        console.error("Erro ao verificar disponibilidade dos barbeiros:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade dos barbeiros.",
          variant: "destructive",
        });
        setBarberAvailability([]);
      } finally {
        setIsCheckingAvailability(false);
      }
    },
    [toast]
  );

  return {
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    fetchAvailableTimes,
    checkBarberAvailability,
  };
};
