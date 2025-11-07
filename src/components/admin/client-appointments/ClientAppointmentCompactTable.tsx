import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ClientAppointmentCompactRow from './ClientAppointmentCompactRow';

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

interface ClientAppointmentCompactTableProps {
  appointments: PainelAgendamento[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentCompactTable: React.FC<ClientAppointmentCompactTableProps> = ({
  appointments,
  isLoading,
  onEdit,
  onStatusChange,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-gray-500 rounded-full"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400 text-sm">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  return (
    <>
      {/* Tabela desktop/tablet */}
      <div className="hidden sm:block w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="font-medium text-gray-900 py-3">Cliente</TableHead>
              <TableHead className="font-medium text-gray-900 py-3 hidden sm:table-cell">Data/Hora</TableHead>
              <TableHead className="font-medium text-gray-900 py-3 hidden md:table-cell">Serviço</TableHead>
              <TableHead className="font-medium text-gray-900 py-3 hidden lg:table-cell">Barbeiro</TableHead>
              <TableHead className="font-medium text-gray-900 py-3">Status</TableHead>
              <TableHead className="font-medium text-gray-900 py-3 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <ClientAppointmentCompactRow
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

      {/* Lista mobile (cards) */}
      <div className="sm:hidden space-y-3">
        {appointments.map((appointment) => (
          <ClientAppointmentCompactRow
            key={appointment.id}
            appointment={appointment}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
};

export default ClientAppointmentCompactTable;
