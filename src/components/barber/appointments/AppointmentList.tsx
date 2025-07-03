
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Scissors, Edit, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentWithDetails {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_name: string;
  service_name: string;
  service?: {
    price?: number;
  };
}

interface AppointmentListProps {
  appointments: AppointmentWithDetails[];
  loading: boolean;
  updatingId: string | null;
  onComplete: (id: string) => void;
  onEdit: (id: string, startTime: string) => void;
  onCancel: (id: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading,
  updatingId,
  onComplete,
  onEdit,
  onCancel
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { variant: 'outline' as const, label: 'Agendado' },
      'confirmed': { variant: 'default' as const, label: 'Confirmado' },
      'completed': { variant: 'secondary' as const, label: 'Concluído' },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelado' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">Nenhum agendamento encontrado</p>
          <p className="text-gray-400 text-sm">Os agendamentos aparecerão aqui quando forem criados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {format(new Date(appointment.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <Clock className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-sm">
                  {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} - 
                  {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{appointment.client_name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4 text-gray-500" />
                <span>{appointment.service_name}</span>
                {appointment.service?.price && (
                  <span className="text-sm text-gray-500">
                    - R$ {appointment.service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {appointment.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{appointment.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(appointment.id, appointment.start_time)}
                    disabled={updatingId === appointment.id}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onComplete(appointment.id)}
                    disabled={updatingId === appointment.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Concluir
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onCancel(appointment.id)}
                    disabled={updatingId === appointment.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
