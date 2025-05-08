
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface AppointmentDateTimeProps {
  date: Date | undefined;
  handleDateChange: (date: Date | undefined) => void;
}

const AppointmentDateTime: React.FC<AppointmentDateTimeProps> = ({ date, handleDateChange }) => {
  return (
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
            {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
  );
};

export default AppointmentDateTime;
