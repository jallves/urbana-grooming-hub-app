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
      'confirmado': { label: 'Confirmado', variant: 'default' as const },
      'concluido': { label: 'Concluído', variant: 'default' as const },
      'cancelado': { label: 'Cancelado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <>
      {/* DESKTOP (Tabela) */}
      <TableRow className="hidden sm:table-row hover:bg-muted/50">
        <TableCell className="py-3">
          <span className="font-medium text-sm">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
        </TableCell>

        <TableCell className="py-3">
          <div className="text-sm">
            {format(new Date(appointment.data), 'dd/MM/yyyy')}
            <div className="text-xs text-muted-foreground">{appointment.hora}</div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="text-sm">
            {appointment.painel_servicos?.nome || 'N/A'}
            <div className="text-xs text-muted-foreground">
              R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-sm">
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
      <div className="sm:hidden border rounded-lg p-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-base">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </h4>
          {getStatusBadge(appointment.status)}
        </div>

        <div className="text-sm">
          <div><span className="text-muted-foreground">Data:</span> {format(new Date(appointment.data), 'dd/MM/yyyy')} às {appointment.hora}</div>
          <div><span className="text-muted-foreground">Serviço:</span> {appointment.painel_servicos?.nome || 'N/A'} - R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}</div>
          <div><span className="text-muted-foreground">Barbeiro:</span> {appointment.painel_barbeiros?.nome || 'N/A'}</div>
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
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Abrir menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={() => onEdit(appointment.id)}>
        <Edit className="mr-2 h-4 w-4" />
        <span className="text-sm">Editar</span>
      </DropdownMenuItem>

      {appointment.status !== 'confirmado' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmado')}>
          <Check className="mr-2 h-4 w-4" />
          <span className="text-sm">Confirmar</span>
        </DropdownMenuItem>
      )}

      {appointment.status !== 'concluido' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'concluido')}>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span className="text-sm">Concluir</span>
        </DropdownMenuItem>
      )}

      {appointment.status !== 'cancelado' && (
        <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelado')}>
          <X className="mr-2 h-4 w-4" />
          <span className="text-sm">Cancelar</span>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        className="text-destructive"
        onClick={() => onDelete(appointment.id)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span className="text-sm">Excluir</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ClientAppointmentCompactRow;
