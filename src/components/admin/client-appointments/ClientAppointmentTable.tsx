
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
      <div className="flex justify-center py-4 sm:py-8">
        <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-4 sm:py-8">
        <p className="text-gray-500 text-sm">Nenhum agendamento de cliente encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs sm:text-sm">
            <TableHead className="w-[120px] sm:w-auto px-2 sm:px-4">Cliente</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden sm:table-cell">WhatsApp</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4">Data</TableHead>
            <TableHead className="w-[70px] sm:w-auto px-2 sm:px-4">Hora</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden md:table-cell">Serviço</TableHead>
            <TableHead className="w-[100px] sm:w-auto px-2 sm:px-4 hidden lg:table-cell">Barbeiro</TableHead>
            <TableHead className="w-[80px] sm:w-auto px-2 sm:px-4">Status</TableHead>
            <TableHead className="w-[60px] sm:w-auto px-2 sm:px-4 text-right">Ações</TableHead>
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
