
import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
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
    email: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
    email: string;
    telefone: string;
    image_url: string;
    specialties: string;
    experience: string;
    commission_rate: number;
    is_active: boolean;
    role: string;
    staff_id: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
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
      <div className="flex justify-center py-8 bg-white">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-gray-400 rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 bg-white">
        <p className="text-gray-500 text-sm">Nenhum agendamento de cliente encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto bg-white">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs sm:text-sm bg-gray-50 border-b border-gray-200">
            <TableHead className="w-[120px] sm:w-auto px-2 sm:px-4 font-medium text-gray-700">Cliente</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden sm:table-cell font-medium text-gray-700">WhatsApp</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4 font-medium text-gray-700">Data</TableHead>
            <TableHead className="w-[70px] sm:w-auto px-2 sm:px-4 font-medium text-gray-700">Hora</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden md:table-cell font-medium text-gray-700">Serviço</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden lg:table-cell font-medium text-gray-700">Barbeiro</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4 font-medium text-gray-700">Status</TableHead>
            <TableHead className="w-[60px] sm:w-auto px-2 sm:px-4 text-right font-medium text-gray-700">Ações</TableHead>
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
