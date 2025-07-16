
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Clock, Trash2, Users, CheckCircle } from 'lucide-react';
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
    <TableRow className="text-xs sm:text-sm hover:bg-gray-50">
      <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col space-y-1">
          <span className="truncate max-w-[100px] sm:max-w-none text-black">
            {appointment.client?.name || 'Cliente não encontrado'}
          </span>
          {isPainelAppointment && (
            <Badge variant="outline" className="text-[10px] sm:text-xs w-fit border-blue-200 text-blue-600">
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
        <span className="truncate max-w-[150px] block text-gray-700">
          {appointment.service?.name || 'Serviço não encontrado'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
        <span className="truncate max-w-[120px] block text-gray-700">
          {appointment.staff?.name || 'Não atribuído'}
        </span>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs text-gray-700">
          {format(new Date(appointment.start_time), 'dd/MM')}
          <div className="sm:hidden text-[9px] text-gray-500">
            {format(new Date(appointment.start_time), 'yyyy')}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-[10px] sm:text-xs text-gray-700">
          {format(new Date(appointment.start_time), 'HH:mm')}
        </div>
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
        <AppointmentStatusBadge status={appointment.status} />
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
            {!isPainelAppointment && (
              <DropdownMenuItem onClick={() => onEdit(appointment.id)} className="hover:bg-gray-50">
                <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                <span className="text-xs sm:text-sm text-gray-700">Editar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'confirmed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')} className="hover:bg-gray-50">
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-700">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')} className="hover:bg-gray-50">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-700">Concluir</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelled')} className="hover:bg-gray-50">
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-gray-700">Cancelar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'no_show' && !isPainelAppointment && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'no_show')} className="hover:bg-gray-50">
                <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                <span className="text-xs sm:text-sm text-gray-700">No-Show</span>
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

export default AppointmentRow;
