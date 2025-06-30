
import React from 'react';
import { format } from 'date-fns';
import { TableCell, TableRow } from "@/components/ui/table";
import { Appointment } from '@/types/appointment';
import AppointmentStatusBadge from '@/components/admin/appointments/list/AppointmentStatusBadge';

interface ClientAppointmentRowProps {
  appointment: Appointment;
}

const ClientAppointmentRow: React.FC<ClientAppointmentRowProps> = ({ 
  appointment
}) => {
  return (
    <TableRow className="border-gray-700 hover:bg-gray-800/50">
      <TableCell className="font-medium text-white">
        {appointment.service?.name || 'Serviço não encontrado'}
      </TableCell>
      <TableCell className="text-gray-300">
        {appointment.staff?.name || 'Não atribuído'}
      </TableCell>
      <TableCell className="text-gray-300">
        {format(new Date(appointment.start_time), 'dd/MM/yyyy')}
      </TableCell>
      <TableCell className="text-gray-300">
        {format(new Date(appointment.start_time), 'HH:mm')}
      </TableCell>
      <TableCell>
        <AppointmentStatusBadge status={appointment.status} />
      </TableCell>
      <TableCell className="text-gray-300">
        R$ {appointment.service?.price?.toFixed(2) || '0,00'}
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentRow;
