
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Scissors, Edit, X, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointmentId: string) => void;
  onCancel: (appointmentId: string) => void;
  onDelete: (appointmentId: string) => void;
  showActions?: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onCancel,
  onDelete,
  showActions = true
}) => {
  const canEdit = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canCancel = appointment.status === 'scheduled' || appointment.status === 'confirmed';

  return (
    <Card className="bg-[#111827] border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white text-lg">
            {appointment.service?.name || 'Serviço não encontrado'}
          </CardTitle>
          <Badge className={statusColors[appointment.status]}>
            {statusLabels[appointment.status] || appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-[#9CA3AF]">
          <Calendar className="mr-2 h-4 w-4 text-[#F59E0B]" />
          <span>
            {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center text-[#9CA3AF]">
          <Clock className="mr-2 h-4 w-4 text-[#F59E0B]" />
          <span>
            {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
          </span>
        </div>

        <div className="flex items-center text-[#9CA3AF]">
          <User className="mr-2 h-4 w-4 text-[#F59E0B]" />
          <span>{appointment.barber?.name || 'Barbeiro não atribuído'}</span>
        </div>

        <div className="flex items-center text-[#9CA3AF]">
          <Scissors className="mr-2 h-4 w-4 text-[#F59E0B]" />
          <span>R$ {appointment.service?.price?.toFixed(2) || '0,00'}</span>
        </div>

        {appointment.notes && (
          <div className="text-[#9CA3AF] text-sm">
            <strong>Observações:</strong> {appointment.notes}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2">
            {canEdit && (
              <Button
                onClick={() => onEdit(appointment.id)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Edit className="mr-1 h-3 w-3" />
                Editar
              </Button>
            )}

            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#111827] border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Cancelar agendamento
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#9CA3AF]">
                      Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                      Não
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onCancel(appointment.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-900"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111827] border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Excluir agendamento
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#9CA3AF]">
                    Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
