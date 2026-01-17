import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ClientAppointmentCompactRow from './ClientAppointmentCompactRow';
import ClientAppointmentMobileCard from './ClientAppointmentMobileCard';

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  status_totem: string | null;
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
  // CORRIGIDO: Usar appointment_totem_sessions (tabela correta)
  appointment_totem_sessions?: Array<{
    totem_session_id: string | null;
    status: string | null;
    totem_sessions: {
      id: string;
      created_at: string | null;
    } | null;
  }>;
  vendas?: Array<{
    id: string;
    status: string | null;
  }>;
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
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-urbana-gold rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-urbana-gold rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 font-medium">Carregando agendamentos...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <div className="p-4 rounded-full bg-gray-100">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600 text-base font-medium">Nenhum agendamento encontrado</p>
        <p className="text-gray-400 text-sm">Tente ajustar os filtros ou aguarde novos agendamentos</p>
      </div>
    );
  }

  return (
    <>
      {/* Tabela desktop/tablet */}
      <div className="hidden sm:block w-full">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-bold py-4 text-gray-700">Cliente</TableHead>
              <TableHead className="font-bold py-4 text-gray-700 hidden sm:table-cell">Data/Hora</TableHead>
              <TableHead className="font-bold py-4 text-gray-700 hidden md:table-cell">Serviço</TableHead>
              <TableHead className="font-bold py-4 text-gray-700 hidden lg:table-cell">Barbeiro</TableHead>
              <TableHead className="font-bold py-4 text-gray-700">Status</TableHead>
              <TableHead className="font-bold py-4 text-gray-700 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment, index) => (
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

      {/* Lista mobile (cards) - Otimizada e com padding */}
      <div className="sm:hidden space-y-3 p-3" style={{ willChange: 'transform' }}>
        {appointments.map((appointment) => (
          <ClientAppointmentMobileCard
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
