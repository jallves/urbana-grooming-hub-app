
import React, { useState } from 'react';
import AppointmentForm from '../AppointmentForm';
import DailySchedule from '../schedule/DailySchedule';
import CalendarHeader from './CalendarHeader';
import CalendarLayout from './CalendarLayout';

const AppointmentCalendar: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  return (
    <div className="space-y-4">
      <CalendarHeader 
        date={date}
        viewMode={viewMode}
        setDate={setDate}
        setViewMode={setViewMode}
        onNewAppointment={() => setIsFormOpen(true)}
      />
      
      <CalendarLayout date={date} setDate={setDate}>
        <DailySchedule date={date} viewMode={viewMode} />
      </CalendarLayout>
      
      <AppointmentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        defaultDate={date}
      />
    </div>
  );
};

export default AppointmentCalendar;
