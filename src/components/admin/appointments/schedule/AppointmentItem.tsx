
import React from 'react';
import { format } from 'date-fns';
import { Appointment } from '@/types/appointment';
import AppointmentStatusBadge from '../list/AppointmentStatusBadge';

interface AppointmentItemProps {
  appointment: Appointment;
  onEdit: (appointmentId: string) => void;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({
  appointment,
  onEdit
}) => {
  return (
    <div
      className="p-3 border border-gray-600 rounded-md hover:bg-gray-700 cursor-pointer transition-colors hover:border-urbana-gold/50"
      onClick={() => onEdit(appointment.id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-white font-raleway">{appointment.client?.name}</p>
          <p className="text-sm text-gray-400 font-raleway">
            {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.service?.name}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
    </div>
  );
};

export default AppointmentItem;
