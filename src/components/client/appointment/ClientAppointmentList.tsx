import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User, Scissors, Edit, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import ClientAppointmentModal from './ClientAppointmentModal';
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

const ClientAppointmentList = () => {
  const { client } = useClientAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    setIsCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_appointment_by_client', {
        p_appointment_id: cancellingAppointment.id,
        p_client_id: client?.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Não foi possível cancelar",
          description: result.error || "Erro desconhecido.",
        });
        return;
      }

      toast({
        title: "✅ Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
      });
    } finally {
      setIsCancelling(false);
      setCancellingAppointment(null);
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
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
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
          <h2 className="text-2xl font-bold text-foreground">Meus Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie seus agendamentos na barbearia</p>
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
        <Card className="text-center py-12 border border-border">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-muted-foreground mb-4">Você ainda não possui nenhum agendamento.</p>
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
              className="rounded-xl border border-border bg-card"
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

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
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
                        onClick={() => setCancellingAppointment(appointment)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-sm text-card-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.staff?.name || 'Barbeiro não definido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-semibold text-green-600">
                    R$ {appointment.services?.price || '0,00'}
                  </span>
                </div>

                {appointment.notes && (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
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

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={!!cancellingAppointment} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Cancelar Agendamento
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>Tem certeza que deseja cancelar este agendamento?</p>
                {cancellingAppointment && (
                  <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                    <p><strong>Serviço:</strong> {cancellingAppointment.services?.name}</p>
                    <p><strong>Data:</strong> {format(new Date(cancellingAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    <p><strong>Barbeiro:</strong> {cancellingAppointment.staff?.name || 'Não definido'}</p>
                  </div>
                )}
                <p className="text-destructive font-medium text-sm">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientAppointmentList;
