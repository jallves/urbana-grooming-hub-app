
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
      'confirmado': { variant: 'default' as const, label: 'Confirmado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'concluido': { variant: 'outline' as const, label: 'Concluído', className: 'bg-green-50 text-green-700 border-green-200' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>;
  };

  return (
    <TableRow className="hover:bg-gray-50 border-b border-gray-100">
      <TableCell className="py-3">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 text-sm">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
          <span className="text-xs text-gray-500 sm:hidden">
            {format(new Date(appointment.data), 'dd/MM/yyyy')} às {appointment.hora}
          </span>
          <div className="md:hidden text-xs text-gray-500 mt-1">
            {appointment.painel_servicos?.nome || 'Serviço N/A'}
          </div>
          <div className="lg:hidden text-xs text-gray-500">
            {appointment.painel_barbeiros?.nome || 'Barbeiro N/A'}
          </div>
        </div>
      </TableCell>
      
      <TableCell className="py-3 hidden sm:table-cell">
        <div className="text-sm text-gray-700">
          <div>{format(new Date(appointment.data), 'dd/MM/yyyy')}</div>
          <div className="text-xs text-gray-500">{appointment.hora}</div>
        </div>
      </TableCell>
      
      <TableCell className="py-3 hidden md:table-cell">
        <div className="text-sm text-gray-700">
          <div>{appointment.painel_servicos?.nome || 'N/A'}</div>
          <div className="text-xs text-gray-500">
            R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
          </div>
        </div>
      </TableCell>
      
      <TableCell className="py-3 hidden lg:table-cell">
        <span className="text-sm text-gray-700">
          {appointment.painel_barbeiros?.nome || 'N/A'}
        </span>
      </TableCell>
      
      <TableCell className="py-3">
        {getStatusBadge(appointment.status)}
      </TableCell>
      
      <TableCell className="text-right py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4 text-gray-600" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
            <DropdownMenuItem onClick={() => onEdit(appointment.id)} className="hover:bg-gray-50">
              <Edit className="mr-2 h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Editar</span>
            </DropdownMenuItem>
            
            {appointment.status !== 'confirmado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')} className="hover:bg-gray-50">
                <Check className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'concluido' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')} className="hover:bg-gray-50">
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Concluir</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelled')} className="hover:bg-gray-50">
                <X className="mr-2 h-4 w-4 text-red-600" />
                <span className="text-sm text-gray-700">Cancelar</span>
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
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentCompactRow;
