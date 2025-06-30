
import React, { useState } from 'react';
import ClientDailySchedule from '../schedule/ClientDailySchedule';
import ClientCalendarHeader from './ClientCalendarHeader';
import ClientCalendarLayout from './ClientCalendarLayout';

interface ClientAppointmentCalendarProps {
  searchQuery?: string;
}

const ClientAppointmentCalendar: React.FC<ClientAppointmentCalendarProps> = ({ searchQuery = '' }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  return (
    <div className="flex flex-col h-full bg-black">
      <ClientCalendarHeader 
        date={date}
        viewMode={viewMode}
        setDate={setDate}
        setViewMode={setViewMode}
      />
      
      <div className="flex-1 overflow-hidden">
        <ClientCalendarLayout date={date} setDate={setDate}>
          <ClientDailySchedule 
            date={date} 
            viewMode={viewMode}
            searchQuery={searchQuery}
          />
        </ClientCalendarLayout>
      </div>
    </div>
  );
};

export default ClientAppointmentCalendar;
