
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Staff } from '@/types/barber';

export interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
  message?: string;
}

export const useAvailability = () => {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const fetchAvailableTimes = async (date: Date, serviceId?: string) => {
    if (!serviceId) {
      setAvailableTimes([]);
      return;
    }

    setIsCheckingAvailability(true);
    
    try {
      // Fetch all staff first from staff table
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Generate time slots based on working hours
      const timeSlots = generateTimeSlots();
      
      // Check availability for each time slot
      const availableSlots: string[] = [];
      
      for (const timeSlot of timeSlots) {
        const hasAvailableBarber = await checkAnyBarberAvailable(date, timeSlot, staffData || []);
        if (hasAvailableBarber) {
          availableSlots.push(timeSlot);
        }
      }
      
      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const checkBarberAvailability = async (
    date: Date, 
    time: string, 
    serviceId: string, 
    barbers: Staff[]
  ) => {
    setIsCheckingAvailability(true);
    
    try {
      const availability: BarberAvailabilityInfo[] = [];
      
      for (const barber of barbers) {
        const isAvailable = await checkSingleBarberAvailability(date, time, barber.id);
        availability.push({
          id: barber.id,
          name: barber.name,
          available: isAvailable,
          message: isAvailable ? 'Disponível' : 'Ocupado neste horário'
        });
      }
      
      setBarberAvailability(availability);
    } catch (error) {
      console.error('Error checking barber availability:', error);
      setBarberAvailability([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Helper functions
  const generateTimeSlots = () => {
    const slots = [];
    const start = 8; // 8 AM
    const end = 18; // 6 PM
    
    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const checkAnyBarberAvailable = async (date: Date, time: string, barbers: Staff[]) => {
    for (const barber of barbers) {
      const isAvailable = await checkSingleBarberAvailability(date, time, barber.id);
      if (isAvailable) {
        return true;
      }
    }
    return false;
  };

  const checkSingleBarberAvailability = async (date: Date, time: string, barberId: string) => {
    try {
      // Check if barber has any appointments at this time
      const dateStr = date.toISOString().split('T')[0];
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentTime = new Date(date);
      appointmentTime.setHours(hours, minutes, 0, 0);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', barberId)
        .gte('start_time', appointmentTime.toISOString())
        .lt('start_time', new Date(appointmentTime.getTime() + 60 * 60 * 1000).toISOString()) // Next hour
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;
      
      return !appointments || appointments.length === 0;
    } catch (error) {
      console.error('Error checking single barber availability:', error);
      return false;
    }
  };

  return {
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    fetchAvailableTimes,
    checkBarberAvailability,
  };
};
