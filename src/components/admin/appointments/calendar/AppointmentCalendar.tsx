
import React, { useState } from 'react';
import AppointmentForm from '../AppointmentForm';
import DailySchedule from '../schedule/DailySchedule';
import CalendarHeader from './CalendarHeader';
import CalendarLayout from './CalendarLayout';

interface AppointmentCalendarProps {
  searchQuery?: string;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ searchQuery = '' }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  return (
    <div className="flex flex-col h-full bg-black">
      <CalendarHeader 
        date={date}
        viewMode={viewMode}
        setDate={setDate}
        setViewMode={setViewMode}
        onNewAppointment={() => setIsFormOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        <CalendarLayout date={date} setDate={setDate}>
          <DailySchedule 
            date={date} 
            viewMode={viewMode}
            searchQuery={searchQuery}
          />
        </CalendarLayout>
      </div>
      
      <AppointmentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        defaultDate={date}
      />
    </div>
  );
};

export default AppointmentCalendar;
