import React, { useState, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { useToast } from "@/hooks/use-toast";
import { Appointment } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeCalendarProps {
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  selectedService: string;
  selectedStaff: string;
}

const RealTimeCalendar: React.FC<RealTimeCalendarProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  selectedService,
  selectedStaff,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          service:services (
            id,
            name,
            price,
            duration
          ),
          staff:staff (
            id,
            name,
            image_url
          )
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedAppointments = (data || []).map(appointment => ({
        ...appointment,
        barber: appointment.staff || { id: '', name: '', image_url: '' }
      })) as Appointment[];

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, fetchAppointments]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCurrentDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
  };

  const isTimeSlotAvailable = (time: string) => {
    if (!selectedDate) return false;

    const [hours, minutes] = time.split(':').map(Number);
    const appointmentTime = new Date(selectedDate);
    appointmentTime.setHours(hours, minutes, 0, 0);

    return !appointments.some(appointment => {
      const startTime = new Date(appointment.start_time);
      const endTime = new Date(appointment.end_time);
      return appointmentTime >= startTime && appointmentTime < endTime;
    });
  };

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

  const timeSlots = generateTimeSlots();

  return (
    <div className="flex flex-col space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>Escolha uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={{ before: new Date() }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-4 gap-2">
        {timeSlots.map(time => (
          <Button
            key={time}
            variant="outline"
            className={cn(
              "justify-center",
              selectedTime === time && "bg-secondary",
              !isTimeSlotAvailable(time) && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => handleTimeSelect(time)}
            disabled={!isTimeSlotAvailable(time)}
          >
            {time}
          </Button>
        ))}
      </div>

      {loading && <div>Carregando agendamentos...</div>}
      {error && <div>{error}</div>}

      {appointments.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium">Agendamentos para {format(currentDate, "PPP")}:</h4>
          <ul>
            {appointments.map(appointment => (
              <li key={appointment.id} className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(appointment.start_time), "HH:mm")} - {appointment.service?.name}</span>
                {appointment.barber && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{appointment.barber.name}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RealTimeCalendar;
