
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppointmentDateTimeProps {
  date: Date | undefined;
  handleDateChange: (date: Date | undefined) => void;
}

const AppointmentDateTime: React.FC<AppointmentDateTimeProps> = ({ date, handleDateChange }) => {
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Generate time slots in 30-minute intervals from 8:00 to 20:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      handleDateChange(newDate);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Data Preferida
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-white/20 border-urbana-gold/50 text-left justify-start h-10"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Horário Preferido
        </label>
        <Select 
          value={selectedTime} 
          onValueChange={handleTimeChange}
        >
          <SelectTrigger className="w-full bg-white/20 border-urbana-gold/50">
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Selecione um horário" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AppointmentDateTime;
