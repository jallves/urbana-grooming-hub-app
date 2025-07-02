
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Scissors, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientAppointmentModal from './ClientAppointmentModal';
import { toast } from '@/hooks/use-toast';

const ClientAppointmentList: React.FC = () => {
  const { client } = useClientAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['client-appointments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, price, duration),
          staff (name, email)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id,
  });

  const handleNewAppointment = () => {
    setSelectedAppointmentId(undefined);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointmentId(undefined);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', variant: 'default' as const },
      confirmed: { label: 'Confirmado', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canEditAppointment = (appointment: any) => {
    const appointmentDate = new Date(appointment.start_time);
    const now = new Date();
    return appointmentDate > now && ['scheduled', 'confirmed'].includes(appointment.status);
  };

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Faça login para ver seus agendamentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h2>
          <p className="text-gray-600">Gerencie seus horários marcados</p>
        </div>
        <Button onClick={handleNewAppointment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-amber-500 rounded-full"></div>
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scissors className="h-5 w-5 text-amber-600" />
                    {(appointment.services as any)?.name || 'Serviço'}
                  </CardTitle>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })} - 
                      {format(new Date(appointment.end_time), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{(appointment.staff as any)?.name || 'Barbeiro não definido'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-sm font-medium">
                      R$ {(appointment.services as any)?.price || '0'}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({(appointment.services as any)?.duration || 0} min)
                    </span>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <strong>Observações:</strong> {appointment.notes}
                    </p>
                  </div>
                )}

                {canEditAppointment(appointment) && (
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAppointment(appointment.id)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Você ainda não possui agendamentos. Que tal marcar um horário?
            </p>
            <Button onClick={handleNewAppointment} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Fazer Primeiro Agendamento
            </Button>
          </CardContent>
        </Card>
      )}

      <ClientAppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
};

export default ClientAppointmentList;
