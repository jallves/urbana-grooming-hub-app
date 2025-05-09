
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types/appointment';

export interface TimeSlot {
  time: Date;
  label: string;
  appointments: Appointment[];
}

interface TimeSlotGeneratorProps {
  date: Date;
  viewMode: 'day' | 'week';
  appointments: Appointment[];
  businessHours: {
    start: number;
    end: number;
  };
}

export const generateTimeSlots = ({
  date,
  viewMode,
  appointments,
  businessHours
}: TimeSlotGeneratorProps): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  // For day view, show 30-minute slots
  if (viewMode === 'day') {
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      // Create slots for both :00 and :30 of each hour
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        slots.push({
          time: slotTime,
          label: format(slotTime, 'HH:mm'),
          appointments: getAppointmentsForTimeSlot(appointments, hour, minute),
        });
      }
    }
    
    return slots;
  }
  
  // For week view, show days
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(weekStart, i);
    
    slots.push({
      time: dayDate,
      label: format(dayDate, 'EEEE, dd/MM', { locale: ptBR }),
      appointments: getAppointmentsForDay(appointments, dayDate),
    });
  }
  
  return slots;
};

// Get appointments for a specific 30-minute slot
const getAppointmentsForTimeSlot = (appointments: Appointment[], hour: number, minute: number) => {
  return appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    return appointmentDate.getHours() === hour && 
           Math.floor(appointmentDate.getMinutes() / 30) * 30 === minute;
  });
};

// Get appointments for a specific day
const getAppointmentsForDay = (appointments: Appointment[], dayDate: Date) => {
  return appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    return (
      appointmentDate.getDate() === dayDate.getDate() &&
      appointmentDate.getMonth() === dayDate.getMonth() &&
      appointmentDate.getFullYear() === dayDate.getFullYear()
    );
  });
};
