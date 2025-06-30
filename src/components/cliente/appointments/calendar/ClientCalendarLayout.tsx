
import React, { ReactNode } from 'react';
import ClientCalendarSidebar from './ClientCalendarSidebar';

interface ClientCalendarLayoutProps {
  date: Date;
  setDate: (date: Date) => void;
  children: ReactNode;
}

const ClientCalendarLayout: React.FC<ClientCalendarLayoutProps> = ({ 
  date, 
  setDate, 
  children 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 bg-black">
      <ClientCalendarSidebar date={date} setDate={setDate} />
      <div className="flex flex-col space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ClientCalendarLayout;
