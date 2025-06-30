
import React, { ReactNode } from 'react';
import CalendarSidebar from './CalendarSidebar';

interface CalendarLayoutProps {
  date: Date;
  setDate: (date: Date) => void;
  children: ReactNode;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ 
  date, 
  setDate, 
  children 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
      <CalendarSidebar date={date} setDate={setDate} />
      <div className="flex flex-col space-y-4">
        {children}
      </div>
    </div>
  );
};

export default CalendarLayout;
