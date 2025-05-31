
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
    if (!date || !serviceId) return;

    setIsCheckingAvailability(true);
    try {
      const selectedDate = new Date(date);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase.functions.invoke('get-available-times', {
        body: {
          date: formattedDate,
          service_id: serviceId
        }
      });

      if (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários disponíveis.",
          variant: "destructive",
        });
        setAvailableTimes([]);
      }

      if (data) {
        setAvailableTimes(data);
      }
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

  const checkBarberAvailability = useCallback(async (date: Date, time: string, serviceId: string, staffId: string) => {
    if (!date || !time || !serviceId || !staffId) {
      setBarberAvailability([]);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const selectedDate = new Date(date);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase.functions.invoke('check-barber-availability', {
        body: {
          date: formattedDate,
          time: time,
          service_id: serviceId,
          staff_id: staffId
        }
      });

      if (error) {
        console.error("Erro ao verificar disponibilidade do barbeiro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade do barbeiro.",
          variant: "destructive",
        });
        setBarberAvailability([]);
      }

      if (data) {
        setBarberAvailability(data.barbers || []);
      }
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
