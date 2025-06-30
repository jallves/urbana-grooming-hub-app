
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

interface CalendarSidebarProps {
  date: Date;
  setDate: (date: Date) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ date, setDate }) => {
  return (
    <Card className="h-fit">
      <CardContent className="pt-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          className="p-3 pointer-events-auto"
        />
      </CardContent>
    </Card>
  );
};

export default CalendarSidebar;
