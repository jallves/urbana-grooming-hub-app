
import { format, isSameDay, startOfDay, addHours } from 'date-fns';
import { Appointment } from '@/types/appointment';

export interface ClientTimeSlot {
  time: Date;
  label: string;
  appointments: Appointment[];
}

interface GenerateClientTimeSlotsParams {
  date: Date;
  viewMode: 'day' | 'week';
  appointments: Appointment[];
  businessHours: {
    start: number;
    end: number;
  };
}

export const generateClientTimeSlots = ({
  date,
  viewMode,
  appointments,
  businessHours
}: GenerateClientTimeSlotsParams): ClientTimeSlot[] => {
  const slots: ClientTimeSlot[] = [];
  const startHour = businessHours.start;
  const endHour = businessHours.end;
  
  // Generate hourly slots
  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = addHours(startOfDay(date), hour);
    
    // Find appointments for this time slot
    const slotAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return (
        isSameDay(appointmentDate, date) &&
        appointmentDate.getHours() === hour
      );
    });
    
    slots.push({
      time: slotTime,
      label: format(slotTime, 'HH:mm'),
      appointments: slotAppointments
    });
  }
  
  return slots;
};
