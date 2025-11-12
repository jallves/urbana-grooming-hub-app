
import React, { useState } from 'react';
import { useAppointments } from './useAppointments';
import { generateTimeSlots } from './TimeSlotGenerator';
import TimeSlot from './TimeSlot';
import AppointmentForm from '../AppointmentForm';

interface DailyScheduleProps {
  date: Date;
  viewMode: 'day' | 'week';
}

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 20, // 8 PM
};

const DailySchedule: React.FC<DailyScheduleProps> = ({ date, viewMode }) => {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [newAppointmentTime, setNewAppointmentTime] = useState<Date | null>(null);
  
  const { appointments, fetchAppointments } = useAppointments({ date, viewMode });
  
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
    appointments,
    businessHours: BUSINESS_HOURS
  });
  
  return (
    <>
      <div className="space-y-2 bg-card/30 p-4 rounded-lg">
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
    </>
  );
};

export default DailySchedule;
