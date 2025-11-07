import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Trash2, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ClientAppointmentCompactRowProps {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentCompactRow: React.FC<ClientAppointmentCompactRowProps> = ({
  appointment,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmado': { label: 'Confirmado', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      'concluido': { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-300' },
      'cancelado': { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>;
  };

  return (
    <>
      {/* DESKTOP (Tabela) */}
      <TableRow className="hidden sm:table-row hover:bg-gray-50 border-b border-gray-200">
        <TableCell className="py-3">
          <span className="font-medium text-gray-900 text-sm">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
        </TableCell>

        <TableCell className="py-3">
          <div className="text-sm text-gray-700">
            {format(new Date(appointment.data), 'dd/MM/yyyy')}
            <div className="text-xs text-gray-500">{appointment.hora}</div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="text-sm text-gray-700">
            {appointment.painel_servicos?.nome || 'N/A'}
            <div className="text-xs text-gray-500">
              R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-sm text-gray-700">
            {appointment.painel_barbeiros?.nome || 'N/A'}
          </span>
        </TableCell>

        <TableCell className="py-3">
          {getStatusBadge(appointment.status)}
        </TableCell>

        <TableCell className="text-right py-3">
          <ActionMenu
            appointment={appointment}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        </TableCell>
      </TableRow>

      {/* MOBILE (Card) */}
      <div className="sm:hidden bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-gray-900 font-semibold text-base">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </h4>
          {getStatusBadge(appointment.status)}
        </div>

        <div className="text-sm text-gray-700">
          <div><span className="text-gray-500">Data:</span> {format(new Date(appointment.data), 'dd/MM/yyyy')} às {appointment.hora}</div>
          <div><span className="text-gray-500">Serviço:</span> {appointment.painel_servicos?.nome || 'N/A'} - R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}</div>
          <div><span className="text-gray-500">Barbeiro:</span> {appointment.painel_barbeiros?.nome || 'N/A'}</div>
        </div>

        <div className="flex justify-end mt-3">
          <ActionMenu
            appointment={appointment}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        </div>
      </div>
    </>
  );
};

const ActionMenu = ({
  appointment,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
        <MoreHorizontal className="h-4 w-4 text-gray-700" />
        <span className="sr-only">Abrir menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
      <DropdownMenuItem onClick={() => onEdit(appointment.id)} className="hover:bg-gray-100">
        <Edit className="mr-2 h-4 w-4 text-gray-700" />
        <span className="text-sm text-gray-900">Editar</span>
      </DropdownMenuItem>

      {appointment.status !== 'confirmado' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmado')} className="hover:bg-gray-100">
          <Check className="mr-2 h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-900">Confirmar</span>
        </DropdownMenuItem>
      )}

      {appointment.status !== 'concluido' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'concluido')} className="hover:bg-gray-100">
          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-900">Concluir</span>
        </DropdownMenuItem>
      )}

      {appointment.status !== 'cancelado' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelado')} className="hover:bg-gray-100">
          <X className="mr-2 h-4 w-4 text-red-600" />
          <span className="text-sm text-gray-900">Cancelar</span>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        className="text-red-600 hover:bg-red-50"
        onClick={() => onDelete(appointment.id)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span className="text-sm">Excluir</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ClientAppointmentCompactRow;
