
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Scissors, Edit, Check, X, Phone, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { 
        variant: 'outline' as const, 
        label: 'Agendado',
        className: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
      },
      'confirmed': { 
        variant: 'default' as const, 
        label: 'Confirmado',
        className: 'border-blue-500/50 text-blue-400 bg-blue-500/10'
      },
      'completed': { 
        variant: 'secondary' as const, 
        label: 'Concluído',
        className: 'border-green-500/50 text-green-400 bg-green-500/10'
      },
      'cancelled': { 
        variant: 'destructive' as const, 
        label: 'Cancelado',
        className: 'border-red-500/50 text-red-400 bg-red-500/10'
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleComplete = async (id: string, clientName: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja marcar o agendamento de ${clientName} como concluído?`);
    if (confirmed) {
      console.log('User confirmed completion for appointment:', id);
      await onComplete(id);
    }
  };

  const handleEdit = (id: string, startTime: string, clientName: string) => {
    const confirmed = window.confirm(`Deseja editar o agendamento de ${clientName}?`);
    if (confirmed) {
      onEdit(id, startTime);
    }
  };

  const handleCancel = async (id: string, clientName: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja cancelar o agendamento de ${clientName}?`);
    if (confirmed) {
      console.log('User confirmed cancellation for appointment:', id);
      await onCancel(id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-600 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-gray-400 text-center max-w-md">
              Os agendamentos aparecerão aqui quando forem criados pelos clientes
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {appointments.map((appointment, index) => (
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-urbana-gold" />
                    <span className="font-medium text-white">
                      {format(new Date(appointment.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-urbana-gold" />
                    <span className="text-gray-300">
                      {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} - 
                      {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-urbana-gold" />
                    <div>
                      <span className="font-semibold text-white text-lg">{appointment.client_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Scissors className="h-5 w-5 text-urbana-gold" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-gray-300 font-medium">{appointment.service_name}</span>
                      {appointment.service?.price && (
                        <span className="text-urbana-gold font-bold">
                          R$ {appointment.service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-400 bg-gray-800 hover:bg-blue-600/10"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Ligar</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-400 bg-gray-800 hover:bg-green-600/10"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </div>
              </div>

              {appointment.notes && (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-urbana-gold">Observações: </span>
                    {appointment.notes}
                  </p>
                </div>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(appointment.id, appointment.start_time, appointment.client_name)}
                    disabled={updatingId === appointment.id}
                    className="border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleComplete(appointment.id, appointment.client_name)}
                    disabled={updatingId === appointment.id}
                    className="bg-green-600 text-white hover:bg-green-700 border-0 min-w-[120px]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {updatingId === appointment.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      'Concluir'
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(appointment.id, appointment.client_name)}
                    disabled={updatingId === appointment.id}
                    className="border-red-600 text-red-400 bg-gray-800 hover:bg-red-600/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
