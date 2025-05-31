
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Edit, Trash2, CheckCircle } from 'lucide-react';
import { ClientEditAppointment } from './ClientEditAppointment';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    name: string;
  };
  discount_amount: number;
  coupon_code: string;
}

export const ClientAppointmentsList = () => {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (client) {
      fetchAppointments();
    }
  }, [client]);

  const fetchAppointments = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          discount_amount,
          coupon_code,
          service:services(name, price, duration),
          staff:staff(name)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos.",
          variant: "destructive",
        });
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Agendamento cancelado",
          description: "Seu agendamento foi cancelado com sucesso.",
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
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

  const canEditOrCancel = (appointment: Appointment) => {
    return appointment.status === 'scheduled' || appointment.status === 'confirmed';
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6">
          <p className="text-white text-center">Carregando agendamentos...</p>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-urbana-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum agendamento encontrado</h3>
          <p className="text-gray-300">Você ainda não possui agendamentos. Crie seu primeiro agendamento!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Meus Agendamentos</h2>
      
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-urbana-gold" />
                  {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="h-4 w-4" />
                    {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="h-4 w-4" />
                    {appointment.staff.name}
                  </div>
                </div>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-white">{appointment.service.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-300">Duração: {appointment.service.duration} min</span>
                  <div className="text-right">
                    {appointment.discount_amount > 0 && (
                      <>
                        <span className="text-gray-400 line-through text-sm">
                          R$ {appointment.service.price.toFixed(2)}
                        </span>
                        <br />
                        <span className="text-urbana-gold font-semibold">
                          R$ {(appointment.service.price - appointment.discount_amount).toFixed(2)}
                        </span>
                        {appointment.coupon_code && (
                          <div className="text-xs text-green-400">
                            Cupom: {appointment.coupon_code}
                          </div>
                        )}
                      </>
                    )}
                    {appointment.discount_amount === 0 && (
                      <span className="text-urbana-gold font-semibold">
                        R$ {appointment.service.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {appointment.notes && (
                <div>
                  <span className="text-gray-300 text-sm">Observações: {appointment.notes}</span>
                </div>
              )}
              
              {canEditOrCancel(appointment) && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingAppointment(appointment)}
                    className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelAppointment(appointment.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {editingAppointment && (
        <ClientEditAppointment
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSuccess={() => {
            setEditingAppointment(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};
