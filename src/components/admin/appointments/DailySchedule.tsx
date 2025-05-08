
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfDay, endOfDay, addMinutes, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import AppointmentForm from './AppointmentForm';
import { Badge } from '@/components/ui/badge';

interface DailyScheduleProps {
  date: Date;
  viewMode: 'day' | 'week';
}

const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 20, // 8 PM
};

// Status colors for appointments
const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const DailySchedule: React.FC<DailyScheduleProps> = ({ date, viewMode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(*),
          service:service_id(*)
        `);
        
      if (viewMode === 'day') {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        query = query
          .gte('start_time', dayStart.toISOString())
          .lte('start_time', dayEnd.toISOString());
      } else {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        
        query = query
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  useEffect(() => {
    fetchAppointments();
  }, [date, viewMode]);
  
  // Generate time slots for the day
  const generateTimeSlots = () => {
    const slots = [];
    
    // For day view, show hourly slots
    if (viewMode === 'day') {
      for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        
        slots.push({
          time: slotTime,
          label: format(slotTime, 'HH:mm'),
          appointments: getAppointmentsForHour(hour),
        });
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
        appointments: getAppointmentsForDay(dayDate),
      });
    }
    
    return slots;
  };
  
  // Get appointments for a specific hour
  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return appointmentDate.getHours() === hour;
    });
  };
  
  // Get appointments for a specific day
  const getAppointmentsForDay = (dayDate: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return (
        appointmentDate.getDate() === dayDate.getDate() &&
        appointmentDate.getMonth() === dayDate.getMonth() &&
        appointmentDate.getFullYear() === dayDate.getFullYear()
      );
    });
  };
  
  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setIsFormOpen(true);
  };
  
  return (
    <>
      <div className="space-y-4">
        {generateTimeSlots().map((slot, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">{slot.label}</h3>
              
              {slot.appointments.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2">
                  {slot.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditAppointment(appointment.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{appointment.client?.name}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.service?.name}
                          </p>
                        </div>
                        <Badge className={statusColors[appointment.status]}>
                          {appointment.status === 'scheduled' && 'Agendado'}
                          {appointment.status === 'confirmed' && 'Confirmado'}
                          {appointment.status === 'completed' && 'Finalizado'}
                          {appointment.status === 'cancelled' && 'Cancelado'}
                          {appointment.status === 'no_show' && 'Não Compareceu'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {isFormOpen && selectedAppointment && (
        <AppointmentForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
          appointmentId={selectedAppointment}
        />
      )}
    </>
  );
};

export default DailySchedule;
