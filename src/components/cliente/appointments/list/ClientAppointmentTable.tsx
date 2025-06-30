
import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Appointment } from '@/types/appointment';
import ClientAppointmentRow from './ClientAppointmentRow';

interface ClientAppointmentTableProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const ClientAppointmentTable: React.FC<ClientAppointmentTableProps> = ({
  appointments,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-urbana-gold rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum agendamento encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">Serviço</TableHead>
            <TableHead className="text-gray-300">Profissional</TableHead>
            <TableHead className="text-gray-300">Data</TableHead>
            <TableHead className="text-gray-300">Horário</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Preço</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <ClientAppointmentRow
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientAppointmentTable;
