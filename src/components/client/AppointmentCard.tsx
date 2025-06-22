
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Edit, Trash2, X } from 'lucide-react';
import { Appointment } from '@/types/appointment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
  showActions?: boolean;
}

const statusColors = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
  'no-show': 'bg-orange-500'
};

const statusLabels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  'no-show': 'Não compareceu'
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onCancel,
  onDelete,
  showActions = true
}) => {
  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);

  return (
    <Card className="bg-[#111827] border-gray-700 hover:border-amber-500/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">
            {appointment.service?.name}
          </CardTitle>
          <Badge 
            className={`${statusColors[appointment.status as keyof typeof statusColors]} text-white`}
          >
            {statusLabels[appointment.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-gray-300">
          <Calendar className="mr-2 h-4 w-4 text-amber-500" />
          <span>{format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
        </div>
        
        <div className="flex items-center text-gray-300">
          <Clock className="mr-2 h-4 w-4 text-amber-500" />
          <span>
            {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
          </span>
        </div>
        
        {appointment.staff && (
          <div className="flex items-center text-gray-300">
            <User className="mr-2 h-4 w-4 text-amber-500" />
            <span>{appointment.staff.name}</span>
          </div>
        )}
        
        {appointment.service?.price && (
          <div className="text-amber-500 font-semibold">
            R$ {appointment.service.price.toFixed(2)}
          </div>
        )}
        
        {appointment.notes && (
          <div className="text-gray-400 text-sm">
            <strong>Observações:</strong> {appointment.notes}
          </div>
        )}
        
        {showActions && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <div className="flex gap-2 pt-3 border-t border-gray-700">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(appointment.id)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="mr-1 h-3 w-3" />
                Editar
              </Button>
            )}
            
            {onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-600 text-orange-400 hover:bg-orange-700"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#111827] border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Cancelar Agendamento
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      Tem certeza que deseja cancelar este agendamento? Esta ação pode ter implicações dependendo da política de cancelamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancel(appointment.id)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Cancelar Agendamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#111827] border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Excluir Agendamento
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(appointment.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
