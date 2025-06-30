
import React from 'react';
import { useClientAppointments } from './useClientAppointments';
import { generateClientTimeSlots } from './ClientTimeSlotGenerator';
import ClientTimeSlot from './ClientTimeSlot';

interface ClientDailyScheduleProps {
  date: Date;
  viewMode: 'day' | 'week';
  searchQuery?: string;
}

const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 20, // 8 PM
};

const ClientDailySchedule: React.FC<ClientDailyScheduleProps> = ({ 
  date, 
  viewMode, 
  searchQuery = '' 
}) => {
  const { appointments } = useClientAppointments({ date, viewMode });
  
  // Filter appointments by search query
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchQuery) return true;
    
    const serviceName = appointment.service?.name?.toLowerCase() || '';
    const staffName = appointment.staff?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return serviceName.includes(query) || staffName.includes(query);
  });
  
  const timeSlots = generateClientTimeSlots({
    date,
    viewMode,
    appointments: filteredAppointments,
    businessHours: BUSINESS_HOURS
  });
  
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-4">
          {timeSlots.map((slot, index) => (
            <ClientTimeSlot
              key={index}
              slot={slot}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDailySchedule;
