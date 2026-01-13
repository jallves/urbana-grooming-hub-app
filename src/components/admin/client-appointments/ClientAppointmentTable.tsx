import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableHead as TableHeadCell,
} from "@/components/ui/table";
import ClientAppointmentRow from './ClientAppointmentRow';

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  created_at: string;
  updated_at: string;
  painel_clientes: {
    nome: string;
    email: string | null;
    whatsapp: string | null;
  } | null;
  painel_barbeiros: {
    nome: string;
    email: string | null;
    telefone: string | null;
    image_url: string | null;
    specialties: string[] | null;
    experience: string | null;
    commission_rate: number | null;
    is_active: boolean | null;
    role: string | null;
    staff_id: string | null;
  } | null;
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  } | null;
}

interface ClientAppointmentTableProps {
  appointments: PainelAgendamento[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentTable: React.FC<ClientAppointmentTableProps> = ({
  appointments,
  isLoading,
  onEdit,
  onStatusChange,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8 bg-gray-900">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-gray-400 rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-900">
        <p className="text-gray-400 text-sm">Nenhum agendamento de cliente encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto bg-gray-900 rounded-lg border border-gray-800">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs sm:text-sm bg-gray-800 border-b border-gray-700">
            <TableHeadCell className="w-[120px] sm:w-auto px-2 sm:px-4 font-medium text-gray-200">Cliente</TableHeadCell>
            <TableHeadCell className="w-[100px] sm:w-auto px-2 sm:px-4 hidden sm:table-cell font-medium text-gray-200">WhatsApp</TableHeadCell>
            <TableHeadCell className="w-[80px] sm:w-auto px-2 sm:px-4 font-medium text-gray-200">Data</TableHeadCell>
            <TableHeadCell className="w-[70px] sm:w-auto px-2 sm:px-4 font-medium text-gray-200">Hora</TableHeadCell>
            <TableHeadCell className="w-[100px] sm:w-auto px-2 sm:px-4 hidden md:table-cell font-medium text-gray-200">Serviço</TableHeadCell>
            <TableHeadCell className="w-[100px] sm:w-auto px-2 sm:px-4 hidden lg:table-cell font-medium text-gray-200">Barbeiro</TableHeadCell>
            <TableHeadCell className="w-[80px] sm:w-auto px-2 sm:px-4 font-medium text-gray-200">Status</TableHeadCell>
            <TableHeadCell className="w-[60px] sm:w-auto px-2 sm:px-4 text-right font-medium text-gray-200">Ações</TableHeadCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <ClientAppointmentRow
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

export default ClientAppointmentTable;
