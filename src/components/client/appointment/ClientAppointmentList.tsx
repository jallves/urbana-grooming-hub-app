import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User, Scissors, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import ClientAppointmentModal from './ClientAppointmentModal';

const ClientAppointmentList = () => {
  const { client } = useClientAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['client-appointments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            id,
            name,
            price,
            duration
          ),
          staff (
            id,
            name,
            email,
            specialties
          )
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!client?.id,
  });

  const handleNewAppointment = () => {
    setEditingAppointmentId(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointmentId: string) => {
    setEditingAppointmentId(appointmentId);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('client_id', client?.id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointmentId(null);
    queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', variant: 'default' as const },
      confirmed: { label: 'Confirmado', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      'no-show': { label: 'Não Compareceu', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h2>
          <p className="text-gray-600">Gerencie seus agendamentos na barbearia</p>
        </div>
        <Button 
          onClick={handleNewAppointment}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Lista de agendamentos */}
      {appointments && appointments.length === 0 ? (
        <Card className="text-center py-12 border border-gray-200">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-gray-500 mb-4">Você ainda não possui nenhum agendamento.</p>
            <Button 
              onClick={handleNewAppointment}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Fazer Primeiro Agendamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments?.map((appointment) => (
            <Card
              key={appointment.id}
              className="rounded-xl border border-gray-200 bg-white"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Scissors className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {appointment.services?.name || 'Serviço não encontrado'}
                      </CardTitle>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>

                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditAppointment(appointment.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-sm text-gray-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{appointment.staff?.name || 'Barbeiro não definido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Preço:</span>
                  <span className="font-semibold text-green-600">
                    R$ {appointment.services?.price || '0,00'}
                  </span>
                </div>

                {appointment.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <strong>Observações:</strong> {appointment.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de agendamento */}
      <ClientAppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        appointmentId={editingAppointmentId || undefined}
      />
    </div>
  );
};

export default ClientAppointmentList;
