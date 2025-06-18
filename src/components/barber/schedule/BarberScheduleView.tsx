
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, CheckCircle, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

interface BarberScheduleViewProps {
  barberId: string;
}

const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({ barberId }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadAppointments();
  }, [barberId, currentWeek]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          client:clients (name, phone),
          service:services (name, duration, price)
        `)
        .eq('staff_id', barberId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time');

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Agendamento ${status === 'completed' ? 'concluído' : 'confirmado'}!`
      });
      loadAppointments();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => 
      format(new Date(appointment.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minha Agenda</h2>
          <p className="text-gray-600">
            Semana de {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            Semana Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            Próxima Semana
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {format(day, 'EEEE', { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {format(day, 'dd/MM', { locale: ptBR })}
                  {isToday && <span className="ml-2 text-blue-600 font-semibold">Hoje</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Sem agendamentos
                  </p>
                ) : (
                  dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm font-medium">
                            {format(new Date(appointment.start_time), 'HH:mm')}
                          </span>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">{appointment.client.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{appointment.service.name}</p>
                        <p className="text-xs text-gray-500">R$ {appointment.service.price.toFixed(2)}</p>
                      </div>

                      {appointment.status === 'scheduled' && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="flex-1 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmar
                          </Button>
                        </div>
                      )}

                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="w-full mt-2 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BarberScheduleView;
