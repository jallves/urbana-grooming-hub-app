
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

interface ClientCalendarSidebarProps {
  date: Date;
  setDate: (date: Date) => void;
}

const ClientCalendarSidebar: React.FC<ClientCalendarSidebarProps> = ({ date, setDate }) => {
  return (
    <Card className="h-fit bg-gray-800 border-gray-700">
      <CardContent className="pt-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          className="p-3 pointer-events-auto text-white [&_.rdp-day_selected]:bg-urbana-gold [&_.rdp-day_selected]:text-black [&_.rdp-day_today]:bg-gray-700 [&_.rdp-day:hover]:bg-gray-600"
        />
      </CardContent>
    </Card>
  );
};

export default ClientCalendarSidebar;
