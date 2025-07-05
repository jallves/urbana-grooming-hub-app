
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Clock, Trash2, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appointment } from '@/types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';

interface AppointmentRowProps {
  appointment: Appointment;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const AppointmentRow: React.FC<AppointmentRowProps> = ({ 
  appointment, 
  onEdit, 
  onStatusChange, 
  onDelete 
}) => {
  const isPainelAppointment = appointment.id.startsWith('painel_');

  return (
    <TableRow className="text-xs sm:text-sm">
      <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col space-y-1">
          <span className="truncate max-w-[100px] sm:max-w-none">
            {appointment.client?.name || 'Cliente não encontrado'}
          </span>
          {isPainelAppointment && (
            <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">
              <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
              Painel
            </Badge>
          )}
          <div className="sm:hidden text-[10px] text-gray-500 space-y-0.5">
            <div>{appointment.service?.name || 'Serviço N/A'}</div>
            <div>{appointment.staff?.name || 'Não atribuído'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
        <span className="truncate max-w-[150px] block">
          {appointment.service?.name || 'Serviço não encontrado'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
        <span className="truncate max-w-[120px] block">
          {appointment.staff?.name || 'Não atribuído'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs">
          {format(new Date(appointment.start_time), 'dd/MM')}
          <div className="sm:hidden text-[9px] text-gray-500">
            {format(new Date(appointment.start_time), 'yyyy')}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs">
          {format(new Date(appointment.start_time), 'HH:mm')}
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <AppointmentStatusBadge status={appointment.status} />
      </TableCell>
      <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 sm:w-48">
            {!isPainelAppointment && (
              <DropdownMenuItem onClick={() => onEdit(appointment.id)}>
                <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Editar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'confirmed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')}>
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')}>
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Finalizar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelled')}>
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Cancelar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'no_show' && !isPainelAppointment && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'no_show')}>
                <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">No-Show</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-red-600"
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

export default AppointmentRow;
