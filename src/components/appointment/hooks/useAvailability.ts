
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
      // Generate time slots from 8:00 to 20:00 in 30-minute intervals
      const timeSlots = [];
      for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          timeSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }

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

  const checkBarberAvailability = useCallback(async (date: Date, time: string, serviceId: string) => {
    if (!date || !time || !serviceId) {
      setBarberAvailability([]);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      console.log('Verificando disponibilidade dos barbeiros...');
      
      // Buscar todos os barbeiros da tabela staff
      const { data: staffMembers, error } = await supabase
        .from('staff')
        .select('id, name, is_active')
        .order('name', { ascending: true });

      if (error) {
        console.error("Erro ao buscar barbeiros:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade dos barbeiros.",
          variant: "destructive",
        });
        setBarberAvailability([]);
        return;
      }

      if (!staffMembers || staffMembers.length === 0) {
        console.log('Nenhum barbeiro encontrado para verificação de disponibilidade');
        setBarberAvailability([]);
        return;
      }

      console.log('Barbeiros encontrados para verificação:', staffMembers);

      // Marcar todos os barbeiros como disponíveis por enquanto
      // Verificação real de conflitos seria implementada aqui
      const availability = staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        available: staff.is_active || false
      }));

      console.log('Disponibilidade dos barbeiros:', availability);
      setBarberAvailability(availability);
    } catch (error) {
      console.error("Erro ao verificar disponibilidade do barbeiro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade do barbeiro.",
        variant: "destructive",
      });
      setBarberAvailability([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [toast]);

  return {
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    fetchAvailableTimes,
    checkBarberAvailability,
  };
};
