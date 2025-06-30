
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Clock, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
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
  return (
    <TableRow>
      <TableCell className="font-medium">
        {appointment.client?.name || 'Cliente não encontrado'}
      </TableCell>
      <TableCell>
        {appointment.service?.name || 'Serviço não encontrado'}
      </TableCell>
      <TableCell>
        {appointment.staff?.name || 'Não atribuído'}
      </TableCell>
      <TableCell>
        {format(new Date(appointment.start_time), 'dd/MM/yyyy')}
      </TableCell>
      <TableCell>
        {format(new Date(appointment.start_time), 'HH:mm')}
      </TableCell>
      <TableCell>
        <AppointmentStatusBadge status={appointment.status} />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(appointment.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            
            {appointment.status !== 'confirmed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')}>
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')}>
                <Check className="mr-2 h-4 w-4" />
                Finalizar
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'cancelled')}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'no_show' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'no_show')}>
                <Clock className="mr-2 h-4 w-4" />
                Marcar como No-Show
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(appointment.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default AppointmentRow;
