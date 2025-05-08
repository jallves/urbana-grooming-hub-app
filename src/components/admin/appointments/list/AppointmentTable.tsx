
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Appointment } from '@/types/appointment';
import AppointmentRow from './AppointmentRow';

interface AppointmentTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  isLoading,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center py-4">
          Carregando agendamentos...
        </TableCell>
      </TableRow>
    );
  }

  if (appointments.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center py-4">
          Nenhum agendamento encontrado
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Horário</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <AppointmentRow
            key={appointment.id}
            appointment={appointment}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default AppointmentTable;
