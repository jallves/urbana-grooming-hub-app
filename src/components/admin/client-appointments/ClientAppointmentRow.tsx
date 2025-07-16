
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

interface ClientAppointmentRowProps {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentRow: React.FC<ClientAppointmentRowProps> = ({ 
  appointment, 
  onEdit, 
  onStatusChange, 
  onDelete 
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmado': { variant: 'default' as const, label: 'Confirmado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'concluido': { variant: 'outline' as const, label: 'Concluído', className: 'bg-green-50 text-green-700 border-green-200' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge className={`text-[10px] sm:text-xs ${config.className}`}>{config.label}</Badge>;
  };

  return (
    <TableRow className="text-xs sm:text-sm hover:bg-gray-50">
      <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col space-y-1">
          <span className="truncate max-w-[100px] sm:max-w-none text-black">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
          <div className="sm:hidden text-[10px] text-gray-500 space-y-0.5">
            <div>{appointment.painel_clientes?.whatsapp || 'N/A'}</div>
            <div className="md:hidden">{appointment.painel_servicos?.nome || 'Serviço N/A'}</div>
            <div className="lg:hidden">{appointment.painel_barbeiros?.nome || 'Barbeiro N/A'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
        <span className="truncate max-w-[120px] block text-gray-700">
          {appointment.painel_clientes?.whatsapp || 'Não informado'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs text-gray-700">
          {format(new Date(appointment.data), 'dd/MM')}
          <div className="sm:hidden text-[9px] text-gray-500">
            {format(new Date(appointment.data), 'yyyy')}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs text-gray-700">
          {appointment.hora}
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
        <span className="truncate max-w-[150px] block text-gray-700">
          {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
        <span className="truncate max-w-[120px] block text-gray-700">
          {appointment.painel_barbeiros?.nome || 'Barbeiro não encontrado'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        {getStatusBadge(appointment.status)}
      </TableCell>
      <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 hover:bg-gray-100">
              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 sm:w-48 bg-white border border-gray-200">
            <DropdownMenuItem onClick={() => onEdit(appointment.id)} className="hover:bg-gray-50">
              <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-700">Editar</span>
            </DropdownMenuItem>
            
            {appointment.status !== 'confirmado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')} className="hover:bg-gray-50">
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-700">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'concluido' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')} className="hover:bg-gray-50">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-700">Concluir</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelled')} className="hover:bg-gray-50">
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-gray-700">Cancelar</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(appointment.id)}
            >
              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentRow;
