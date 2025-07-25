
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
      'agendado': { variant: 'outline' as const, label: 'Agendado', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge className={`text-[10px] sm:text-xs ${config.className}`}>{config.label}</Badge>;
  };

  return (
    <TableRow className="text-xs sm:text-sm hover:bg-gray-50">
      <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3 max-w-[100px] sm:max-w-none">
        <div className="flex flex-col space-y-1 truncate">
          <span className="truncate text-black">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
          {/* Info adicional visível só no mobile */}
          <div className="sm:hidden text-[10px] text-gray-500 space-y-0.5 truncate">
            <div>{appointment.painel_clientes?.whatsapp || 'N/A'}</div>
            <div className="md:hidden truncate">{appointment.painel_servicos?.nome || 'Serviço N/A'}</div>
            <div className="lg:hidden truncate">{appointment.painel_barbeiros?.nome || 'Barbeiro N/A'}</div>
          </div>
        </div>
      </TableCell>

      {/* WhatsApp: visível a partir do sm */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell max-w-[120px] truncate">
        <span className="text-gray-700 truncate">
          {appointment.painel_clientes?.whatsapp || 'Não informado'}
        </span>
      </TableCell>

      {/* Data */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[70px] truncate">
        <div className="text-[10px] sm:text-xs text-gray-700 truncate">
          {format(new Date(appointment.data), 'dd/MM')}
          <div className="sm:hidden text-[9px] text-gray-500 truncate">
            {format(new Date(appointment.data), 'yyyy')}
          </div>
        </div>
      </TableCell>

      {/* Hora */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[50px] truncate">
        <div className="text-[10px] sm:text-xs text-gray-700 truncate">
          {appointment.hora}
        </div>
      </TableCell>

      {/* Serviço: visível a partir do md */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell max-w-[150px] truncate">
        <span className="text-gray-700 truncate block">
          {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
        </span>
      </TableCell>

      {/* Barbeiro: visível a partir do lg */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell max-w-[120px] truncate">
        <span className="text-gray-700 truncate block">
          {appointment.painel_barbeiros?.nome || 'Barbeiro não encontrado'}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[90px] whitespace-nowrap">
        {getStatusBadge(appointment.status)}
      </TableCell>

      {/* Ações */}
      <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 max-w-[60px] whitespace-nowrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 hover:bg-gray-100">
              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
            <DropdownMenuItem onClick={() => onEdit(appointment.id)} className="hover:bg-gray-50">
              <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-700">Editar</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {appointment.status !== 'agendado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'agendado')} className="hover:bg-gray-50">
                <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                <span className="text-xs sm:text-sm text-gray-700">Marcar como Agendado</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'confirmado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmado')} className="hover:bg-gray-50">
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-700">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'concluido' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'concluido')} className="hover:bg-gray-50">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-700">Concluir</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelado')} className="hover:bg-gray-50">
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-gray-700">Cancelar</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
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
