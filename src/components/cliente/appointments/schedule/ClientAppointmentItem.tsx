
import React from 'react';
import { format } from 'date-fns';
import { Appointment } from '@/types/appointment';
import AppointmentStatusBadge from '@/components/admin/appointments/list/AppointmentStatusBadge';

interface ClientAppointmentItemProps {
  appointment: Appointment;
}

const ClientAppointmentItem: React.FC<ClientAppointmentItemProps> = ({
  appointment
}) => {
  return (
    <div className="p-3 border border-gray-600 rounded-md bg-gray-700/50">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-white font-raleway">{appointment.service?.name}</p>
          <p className="text-sm text-gray-400 font-raleway">
            {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.staff?.name}
          </p>
          {appointment.notes && (
            <p className="text-xs text-gray-500 mt-1 font-raleway">{appointment.notes}</p>
          )}
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
    </div>
  );
};

export default ClientAppointmentItem;
