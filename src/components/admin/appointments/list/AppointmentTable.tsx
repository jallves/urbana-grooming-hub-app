
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
      <div className="flex justify-center py-4 sm:py-8">
        <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-4 sm:py-8">
        <p className="text-gray-500 text-sm">Nenhum agendamento encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs sm:text-sm">
            <TableHead className="w-[120px] sm:w-auto px-2 sm:px-4">Cliente</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden sm:table-cell">Serviço</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden md:table-cell">Barbeiro</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4">Data</TableHead>
            <TableHead className="w-[70px] sm:w-auto px-2 sm:px-4">Hora</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4">Status</TableHead>
            <TableHead className="w-[60px] sm:w-auto px-2 sm:px-4 text-right">Ações</TableHead>
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
