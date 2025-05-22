
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Edit, CalendarX, Clock } from 'lucide-react';

interface AppointmentCardProps {
  appointment: any;
  onComplete: (id: string) => void;
  onEdit: (id: string, startTime: string) => void;
  onCancel: (id: string) => void;
  updatingId: string | null;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onComplete,
  onEdit,
  onCancel,
  updatingId
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'confirmed': return 'Confirmado';
      default: return 'Agendado';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-2">
          <div className="flex justify-between">
            <p className="font-medium">{appointment.clients?.name || 'Cliente não identificado'}</p>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(appointment.start_time)}
          </p>
          <div className="flex justify-between items-center">
            <p className="font-medium">{appointment.services?.name || 'Serviço não especificado'}</p>
            <p className="font-medium text-right">
              R$ {Number(appointment.services?.price || 0).toFixed(2).replace('.', ',')}
            </p>
          </div>
          {appointment.notes && <p className="text-sm text-gray-600 italic">"{appointment.notes}"</p>}
          
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-green-600 text-green-600 hover:bg-green-50 flex-1"
                onClick={() => onComplete(appointment.id)}
                disabled={updatingId === appointment.id}
              >
                {updatingId === appointment.id ? (
                  <Clock className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Finalizar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1"
                onClick={() => onEdit(appointment.id, appointment.start_time)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                onClick={() => onCancel(appointment.id)}
              >
                <CalendarX className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
