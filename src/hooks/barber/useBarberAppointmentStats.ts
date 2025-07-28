
import { useMemo } from 'react';

interface AppointmentWithDetails {
  id: string;
  status: string;
  start_time: string;
  service?: {
    price?: number;
  };
}

export const useBarberAppointmentStats = (appointments: AppointmentWithDetails[]) => {
  return useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const upcoming = appointments.filter(a => 
      a.status !== 'completed' && 
      a.status !== 'cancelled' && 
      new Date(a.start_time) > new Date()
    ).length;
    
    const revenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appointment) => {
        const servicePrice = appointment.service?.price || 0;
        return acc + Number(servicePrice);
      }, 0);

    return { total, completed, upcoming, revenue };
  }, [appointments]);
};
