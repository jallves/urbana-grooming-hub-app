
import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Clock, Trash2, Users, CheckCircle, UserX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Appointment } from '@/types/appointment';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { isPastInBrazil } from '@/lib/brazilTimezone';
import { toast } from 'sonner';

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
  const [isAbsentDialogOpen, setIsAbsentDialogOpen] = useState(false);
  const isPainelAppointment = appointment.id.startsWith('painel_');

  // Verificar se pode marcar como ausente (horário já passou e status apropriado)
  const canMarkAsAbsent = () => {
    const status = appointment.status?.toLowerCase();
    
    // Só pode marcar como ausente se status for agendado, confirmado ou scheduled
    const allowedStatuses = ['agendado', 'scheduled', 'confirmed', 'confirmado'];
    if (!allowedStatuses.includes(status)) {
      return false;
    }

    // Verificar se o horário já passou
    try {
      return isPastInBrazil(appointment.start_time);
    } catch (error) {
      console.error('Erro ao validar horário para ausente:', error);
      return false;
    }
  };

  const handleAbsentClick = () => {
    setIsAbsentDialogOpen(true);
  };

  const handleConfirmAbsent = () => {
    onStatusChange(appointment.id, 'ausente');
    setIsAbsentDialogOpen(false);
    toast.warning('Cliente marcado como ausente', {
      description: 'Este agendamento não gerará receita ou comissão.'
    });
  };

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
          <div className="sm:hidden text-[10px] text-muted-foreground space-y-0.5">
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
          <div className="sm:hidden text-[9px] text-muted-foreground">
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
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Concluir</span>
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

            {/* Botão Ausente - aparece quando horário já passou */}
            {canMarkAsAbsent() && appointment.status !== 'ausente' && (
              <DropdownMenuItem onClick={handleAbsentClick}>
                <UserX className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Marcar Ausente</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(appointment.id)}
            >
              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialog de Marcar como Ausente */}
        <AlertDialog open={isAbsentDialogOpen} onOpenChange={setIsAbsentDialogOpen}>
          <AlertDialogContent className="bg-white border-2 border-gray-200 shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-700 font-bold text-xl flex items-center gap-2">
                👻 Marcar Cliente como Ausente
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p className="text-base text-gray-900">
                  Você está marcando{' '}
                  <strong className="text-gray-700">{appointment.client?.name}</strong>
                  {' '}como ausente.
                </p>
                
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    📋 Detalhes do Agendamento:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>Serviço:</strong> {appointment.service?.name}</li>
                    <li><strong>Data:</strong> {format(new Date(appointment.start_time), 'dd/MM/yyyy')} às {format(new Date(appointment.start_time), 'HH:mm')}</li>
                    <li><strong>Barbeiro:</strong> {appointment.staff?.name}</li>
                    <li><strong>Valor:</strong> R$ {appointment.service?.price?.toFixed(2)}</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>Atenção:</strong> O cliente não compareceu. Este agendamento <strong>NÃO gerará receita nem comissão</strong> para o barbeiro.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200">
                Voltar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAbsent}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold"
              >
                Confirmar Ausência
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

export default AppointmentRow;
