
import React, { memo } from 'react';
import { Clock, User, CheckCircle, XCircle, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentCardOptimizedProps {
  appointment: {
    id: string;
    start_time: string;
    client_name: string;
    service_name: string;
    status: string;
    service?: {
      price?: number;
    };
  };
  updatingId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (id: string, startTime: string) => void;
}

const AppointmentCardOptimized = memo(({ 
  appointment, 
  updatingId, 
  onComplete, 
  onCancel, 
  onEdit 
}: AppointmentCardOptimizedProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'confirmed': return 'Confirmado';
      default: return 'Agendado';
    }
  };

  const isUpdating = updatingId === appointment.id;
  const appointmentDate = new Date(appointment.start_time);
  const canEdit = appointment.status !== 'completed' && appointment.status !== 'cancelled';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{appointment.client_name}</h3>
            <p className="text-sm text-gray-400">{appointment.service_name}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(appointment.status)} font-medium`}>
          {getStatusLabel(appointment.status)}
        </Badge>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2 text-gray-300">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        {appointment.service?.price && (
          <div className="text-sm font-medium text-green-400">
            R$ {appointment.service.price.toFixed(2)}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onComplete(appointment.id)}
            disabled={isUpdating}
            className="bg-green-600 text-white flex-1"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Concluir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(appointment.id, appointment.start_time)}
            disabled={isUpdating}
            className="border-gray-600"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(appointment.id)}
            disabled={isUpdating}
            className="border-red-600 text-red-400"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});

AppointmentCardOptimized.displayName = 'AppointmentCardOptimized';

export default AppointmentCardOptimized;
