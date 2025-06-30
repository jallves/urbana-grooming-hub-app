
import React, { useState } from 'react';
import { useAppointments } from './useAppointments';
import { generateTimeSlots } from './TimeSlotGenerator';
import TimeSlot from './TimeSlot';
import AppointmentForm from '../AppointmentForm';

interface DailyScheduleProps {
  date: Date;
  viewMode: 'day' | 'week';
  searchQuery?: string;
}

const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 20, // 8 PM
};

const DailySchedule: React.FC<DailyScheduleProps> = ({ date, viewMode, searchQuery = '' }) => {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [newAppointmentTime, setNewAppointmentTime] = useState<Date | null>(null);
  
  const { appointments, fetchAppointments } = useAppointments({ date, viewMode });
  
  // Filter appointments by search query
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchQuery) return true;
    
    const clientName = appointment.client?.name?.toLowerCase() || '';
    const serviceName = appointment.service?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return clientName.includes(query) || serviceName.includes(query);
  });
  
  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setIsCreatingAppointment(false);
    setIsFormOpen(true);
  };
  
  const handleCreateAppointment = (slotTime: Date) => {
    setNewAppointmentTime(slotTime);
    setSelectedAppointment(null);
    setIsCreatingAppointment(true);
    setIsFormOpen(true);
  };

  const timeSlots = generateTimeSlots({
    date,
    viewMode,
    appointments: filteredAppointments,
    businessHours: BUSINESS_HOURS
  });
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-4">
          {timeSlots.map((slot, index) => (
            <TimeSlot
              key={index}
              slot={slot}
              onCreateAppointment={handleCreateAppointment}
              onEditAppointment={handleEditAppointment}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
      
      {isFormOpen && (
        <AppointmentForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
            setIsCreatingAppointment(false);
            fetchAppointments();
          }}
          appointmentId={selectedAppointment}
          defaultDate={isCreatingAppointment && newAppointmentTime ? newAppointmentTime : new Date()}
        />
      )}
    </div>
  );
};

export default DailySchedule;
