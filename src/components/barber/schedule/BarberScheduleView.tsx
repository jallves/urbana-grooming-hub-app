
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Settings, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BarberScheduleManager from './BarberScheduleManager';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  client: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
    duration: number;
  };
  status: string;
}

interface BarberScheduleViewProps {
  barberId: string;
}

const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({ barberId }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [barberInfo, setBarberInfo] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetchBarberInfo();
    fetchAppointments();
  }, [barberId, selectedDate]);

  const fetchBarberInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('name')
        .eq('id', barberId)
        .single();

      if (error) throw error;
      setBarberInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações do barbeiro:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          client:client_id(name, phone),
          service:service_id(name, duration)
        `)
        .eq('staff_id', barberId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(appointment => 
      appointment.start_time.startsWith(dateStr)
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-urbana-gold' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {format(day, 'EEEE', { locale: ptBR })}
                  <div className="text-lg font-bold">
                    {format(day, 'dd/MM')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem agendamentos</p>
                ) : (
                  dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-urbana-gold/10 border border-urbana-gold/20 rounded p-2 text-xs"
                    >
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(appointment.start_time), 'HH:mm')}
                      </div>
                      <div className="text-urbana-black/80">
                        {appointment.client.name}
                      </div>
                      <div className="text-urbana-black/60">
                        {appointment.service.name}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (showScheduleManager) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Configurar Horários</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowScheduleManager(false)}
          >
            Voltar à Agenda
          </Button>
        </div>
        <BarberScheduleManager 
          barberId={barberId} 
          barberName={barberInfo?.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-urbana-gold" />
            Minha Agenda
          </h2>
          {barberInfo && (
            <p className="text-muted-foreground">
              {barberInfo.name} - {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowScheduleManager(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar Horários
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setSelectedDate(addDays(selectedDate, -7))}
        >
          Semana Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => setSelectedDate(new Date())}
        >
          Hoje
        </Button>
        <Button
          variant="outline"
          onClick={() => setSelectedDate(addDays(selectedDate, 7))}
        >
          Próxima Semana
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Carregando agenda...
          </div>
        </div>
      ) : (
        renderWeekView()
      )}
    </div>
  );
};

export default BarberScheduleView;
