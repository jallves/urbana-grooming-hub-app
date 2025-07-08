
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentInfo {
  id: string;
  data: string;
  hora: string;
  client_name: string;
  service_name: string;
  status: string;
  service_price: number;
}

const BarberScheduleView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [barberId, setBarberId] = useState<string | null>(null);

  // Buscar ID do barbeiro baseado no usuário logado
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!user?.email) return;

      try {
        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (data?.id) {
          setBarberId(data.id);
        }
      } catch (error) {
        console.error('Error fetching barber ID:', error);
      }
    };

    fetchBarberId();
  }, [user?.email]);

  useEffect(() => {
    if (barberId) {
      loadAppointments();
    }
  }, [barberId, currentWeek]);

  const loadAppointments = async () => {
    if (!barberId) return;
    
    setLoading(true);
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

      console.log('Fetching appointments for barber:', barberId, 'from', weekStart, 'to', weekEnd);

      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome),
          painel_servicos!inner(nome, preco)
        `)
        .eq('barbeiro_id', barberId)
        .gte('data', weekStart)
        .lte('data', weekEnd)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        return;
      }

      if (data) {
        console.log('Appointments found:', data.length);
        
        const appointmentsWithDetails = data.map(appointment => ({
          id: appointment.id,
          data: appointment.data,
          hora: appointment.hora,
          client_name: appointment.painel_clientes.nome,
          service_name: appointment.painel_servicos.nome,
          status: appointment.status === 'cancelado' ? 'cancelled' : 
                  appointment.status === 'confirmado' ? 'confirmed' : 
                  appointment.status === 'concluido' ? 'completed' : 'scheduled',
          service_price: appointment.painel_servicos.preco
        }));
        
        setAppointments(appointmentsWithDetails);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.data === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'confirmed':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'completed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Agendado';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Faça login para ver sua agenda</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-urbana-gold" />
            Minha Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">Agenda da Semana</h3>
              <p className="text-sm text-gray-400">
                Semana de {format(currentWeek, 'dd/MM', { locale: ptBR })} a {' '}
                {format(addDays(currentWeek, 6), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Semana Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Próxima Semana
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-300">Carregando agenda...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {Array.from({ length: 7 }, (_, index) => {
                const date = addDays(currentWeek, index);
                const dayAppointments = getAppointmentsForDay(date);
                const dayName = format(date, 'EEEE', { locale: ptBR });

                return (
                  <div key={index} className="space-y-3">
                    <div className="text-center">
                      <div className="font-medium capitalize text-white text-sm">{dayName}</div>
                      <div className="text-sm text-gray-400">
                        {format(date, 'dd/MM', { locale: ptBR })}
                      </div>
                      <Badge variant="outline" className="mt-1 border-gray-600 text-gray-300 bg-gray-800 text-xs">
                        {dayAppointments.length} agendamentos
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {dayAppointments.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-4 bg-gray-800 rounded-lg border border-gray-700">
                          Nenhum agendamento
                        </div>
                      ) : (
                        dayAppointments.map((appointment) => (
                          <Card key={appointment.id} className="p-3 text-xs bg-gray-700 border-gray-600">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge className={getStatusColor(appointment.status) + " text-xs"}>
                                  {getStatusLabel(appointment.status)}
                                </Badge>
                                <div className="flex items-center text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {appointment.hora}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-white flex items-center text-sm">
                                  <User className="h-3 w-3 mr-1" />
                                  {appointment.client_name}
                                </div>
                                <div className="text-gray-300 text-xs">{appointment.service_name}</div>
                                <div className="text-urbana-gold text-xs font-medium">
                                  R$ {appointment.service_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberScheduleView;
