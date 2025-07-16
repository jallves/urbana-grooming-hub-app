import React from 'react';
import {
  Table,
  TableBody,
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
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-yellow-500 rounded-full" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow className="text-sm text-gray-700">
            <TableHead className="px-3 py-2">Cliente</TableHead>
            <TableHead className="px-3 py-2 hidden sm:table-cell">Serviço</TableHead>
            <TableHead className="px-3 py-2 hidden md:table-cell">Barbeiro</TableHead>
            <TableHead className="px-3 py-2">Data</TableHead>
            <TableHead className="px-3 py-2">Hora</TableHead>
            <TableHead className="px-3 py-2">Status</TableHead>
            <TableHead className="px-3 py-2 text-right">Ações</TableHead>
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
    </div>
  );
};

export default AppointmentTable;
