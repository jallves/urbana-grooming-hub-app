
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
      // Gerar horários em intervalos de 30 min das 8h às 20h
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

  const checkBarberAvailability = useCallback(
    async (date: Date, time: string, serviceId: string, externalBarbers?: any[]) => {
      if (!date || !time || !serviceId) {
        setBarberAvailability([]);
        return;
      }
      setIsCheckingAvailability(true);
      try {
        let staffMembers: any[] = [];

        if (Array.isArray(externalBarbers) && externalBarbers.length > 0) {
          staffMembers = externalBarbers;
        } else {
          // Busca direto do banco
          const { data: dbStaff, error: staffError } = await supabase
            .from("staff")
            .select("id, name, is_active, role")
            .eq("is_active", true)
            .eq("role", "barber")
            .order("name", { ascending: true });

          if (staffError || !dbStaff || dbStaff.length === 0) {
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
        }

        // Busca duração correta do serviço
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("duration")
          .eq("id", serviceId)
          .maybeSingle();

        let serviceDuration = 60;
        if (!serviceError && serviceData && serviceData.duration) {
          serviceDuration = serviceData.duration;
        }

        // Calcula hora início/fim da consulta (importante: UTC)
        const [hours, minutes] = time.split(":").map(Number);
        const startTime = new Date(date);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + serviceDuration * 60000);

        // Itera todos barbeiros e verifica conflito
        const availability = await Promise.all(
          staffMembers.map(async (staff) => {
            // Caso use id numerico, converte pra string
            const barberId = staff.id?.toString?.() ?? staff.id;

            // Busca todos agendamentos ativos do dia
            const startOfDay = new Date(startTime);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startTime);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: appointments, error: appointmentError } = await supabase
              .from("appointments")
              .select("id, start_time, end_time, status")
              .eq("staff_id", barberId)
              .in("status", ["scheduled", "confirmed"])
              .gte("start_time", startOfDay.toISOString())
              .lte("start_time", endOfDay.toISOString());

            if (appointmentError) {
              return {
                id: barberId,
                name: staff.name,
                available: false,
              };
            }

            // Checa se existe horário conflitante
            let hasConflict = false;
            if (appointments && appointments.length > 0) {
              hasConflict = appointments.some((appointment) => {
                const appStart = new Date(appointment.start_time);
                const appEnd = new Date(appointment.end_time);
                return (
                  startTime < appEnd && endTime > appStart
                );
              });
            }

            return {
              id: barberId,
              name: staff.name,
              available: !hasConflict,
            };
          })
        );

        setBarberAvailability(availability);
      } catch (error) {
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
