
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Clock, User, Scissors, MapPin } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  barber: {
    id: string;
    name: string;
    image_url: string;
  };
}

const statusColors = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500'
};

const statusLabels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou'
};

export const RealTimeCalendar: React.FC = () => {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
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
          service:services (
            id,
            name,
            price,
            duration
          ),
          barber:barbers (
            id,
            name,
            image_url
          )
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAppointments(data as Appointment[]);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Real-time subscription
  useEffect(() => {
    if (!client) return;

    const channel = supabase
      .channel('client-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `client_id=eq.${client.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          loadAppointments();
          
          // Show notification for real-time updates
          if (payload.eventType === 'UPDATE') {
            toast({
              title: "Status atualizado",
              description: "Seu agendamento foi atualizado em tempo real.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client, loadAppointments, toast]);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.start_time), date)
    );
  };

  const getDatesWithAppointments = () => {
    return appointments.map(appointment => parseISO(appointment.start_time));
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);
  const datesWithAppointments = getDatesWithAppointments();

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentTime = parseISO(appointment.start_time);
    const now = new Date();
    const hoursDiff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff >= 24 && appointment.status === 'scheduled';
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <div className="h-80 bg-gray-800 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-800 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calendário */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Meus Agendamentos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Visualize seus agendamentos no calendário
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            weekStartsOn={1}
            className="rounded-md border-gray-600"
            modifiers={{
              hasAppointment: datesWithAppointments
            }}
            modifiersStyles={{
              hasAppointment: {
                backgroundColor: '#F59E0B',
                color: 'black',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Lista de Agendamentos do Dia */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {selectedDateAppointments.length} agendamento(s) neste dia
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {selectedDateAppointments.length > 0 ? (
            <div className="space-y-4">
              {selectedDateAppointments.map((appointment) => (
                <Card key={appointment.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge 
                        className={`${statusColors[appointment.status as keyof typeof statusColors]} text-white`}
                      >
                        {statusLabels[appointment.status as keyof typeof statusLabels]}
                      </Badge>
                      <div className="flex items-center gap-2 text-amber-500">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">
                          {format(parseISO(appointment.start_time), 'HH:mm')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Serviço */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Scissors className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{appointment.service.name}</p>
                          <p className="text-sm text-gray-400">
                            {appointment.service.duration} min • R$ {appointment.service.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Barbeiro */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={appointment.barber.image_url} alt={appointment.barber.name} />
                          <AvatarFallback className="bg-green-500 text-white text-sm">
                            {appointment.barber.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{appointment.barber.name}</p>
                          <p className="text-sm text-gray-400">Barbeiro</p>
                        </div>
                      </div>

                      {/* Observações */}
                      {appointment.notes && (
                        <div className="bg-gray-700 rounded p-3">
                          <p className="text-sm text-gray-300">{appointment.notes}</p>
                        </div>
                      )}

                      {/* Ações */}
                      {canCancelAppointment(appointment) && (
                        <div className="pt-2 border-t border-gray-700">
                          <Button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            Cancelar Agendamento
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum agendamento neste dia</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeCalendar;
