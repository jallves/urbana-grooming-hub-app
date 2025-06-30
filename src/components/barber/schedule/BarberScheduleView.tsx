
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BarberInfo {
  id: string;
  name: string;
  specialties: string;
  image_url: string;
}

interface AppointmentInfo {
  id: string;
  start_time: string;
  end_time: string;
  client_name: string;
  service_name: string;
  status: string;
  notes?: string;
}

const BarberScheduleView: React.FC = () => {
  const [barbers, setBarbers] = useState<BarberInfo[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [appointments, setAppointments] = useState<AppointmentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    loadBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber) {
      loadAppointments();
    }
  }, [selectedBarber, currentWeek]);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, specialties, image_url')
        .eq('role', 'barber')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading barbers:', error);
        return;
      }

      if (data) {
        setBarbers(data.map(barber => ({
          id: barber.id,
          name: barber.name,
          specialties: barber.specialties || '',
          image_url: barber.image_url || '',
        })));
      }
    } catch (error) {
      console.error('Error loading barbers:', error);
    }
  };

  const loadAppointments = async () => {
    if (!selectedBarber) return;
    
    setLoading(true);
    try {
      const weekStart = currentWeek;
      const weekEnd = addDays(currentWeek, 6);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          clients (name),
          services (name)
        `)
        .eq('staff_id', selectedBarber)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        return;
      }

      if (data) {
        const appointmentsWithDetails = data.map(appointment => ({
          id: appointment.id,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          client_name: (appointment.clients as any)?.name || 'Cliente Desconhecido',
          service_name: (appointment.services as any)?.name || 'Serviço Desconhecido',
          status: appointment.status,
          notes: appointment.notes || '',
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
    return appointments.filter(apt => 
      isSameDay(new Date(apt.start_time), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedBarberInfo = barbers.find(b => b.id === selectedBarber);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Agenda dos Barbeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecionar Barbeiro:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {barbers.map((barber) => (
                  <Card 
                    key={barber.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedBarber === barber.id ? 'ring-2 ring-amber-500 bg-amber-50' : ''
                    }`}
                    onClick={() => setSelectedBarber(barber.id)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{barber.name}</div>
                        {barber.specialties && (
                          <div className="text-xs text-gray-500 mt-1">{barber.specialties}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedBarberInfo && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Agenda de {selectedBarberInfo.name}</h3>
                  <p className="text-sm text-gray-500">
                    Semana de {format(currentWeek, 'dd/MM', { locale: ptBR })} a {' '}
                    {format(addDays(currentWeek, 6), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  >
                    Semana Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  >
                    Próxima Semana
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedBarber && (
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Carregando agenda...</div>
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
                        <div className="font-medium capitalize">{dayName}</div>
                        <div className="text-sm text-gray-500">
                          {format(date, 'dd/MM', { locale: ptBR })}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {dayAppointments.length} agendamentos
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {dayAppointments.length === 0 ? (
                          <div className="text-center text-gray-400 text-sm py-4">
                            Nenhum agendamento
                          </div>
                        ) : (
                          dayAppointments.map((appointment) => (
                            <Card key={appointment.id} className="p-3 text-xs">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(new Date(appointment.start_time), 'HH:mm')}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">{appointment.client_name}</div>
                                  <div className="text-gray-600">{appointment.service_name}</div>
                                  {appointment.notes && (
                                    <div className="text-gray-500 mt-1">{appointment.notes}</div>
                                  )}
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
      )}
    </div>
  );
};

export default BarberScheduleView;
