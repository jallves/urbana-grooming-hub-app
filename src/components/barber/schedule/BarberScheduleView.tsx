
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  service_name: string;
  client_name: string;
  status: string;
}

const BarberScheduleView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberInfo, setBarberInfo] = useState<{ name: string }>({ name: '' });

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!user?.email) return;

      try {
        // Buscar informações do barbeiro na tabela barbers
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('id, name')
          .eq('email', user.email)
          .eq('role', 'barber')
          .single();

        if (barberError) {
          console.error('Erro ao buscar barbeiro:', barberError);
          setBarberInfo({ name: 'Barbeiro' });
          return;
        }

        setBarberInfo({ name: barberData.name });

        // Buscar agendamentos do barbeiro
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            start_time,
            end_time,
            status,
            services (name),
            clients (name)
          `)
          .eq('staff_id', barberData.id)
          .gte('start_time', new Date().toISOString().split('T')[0])
          .order('start_time');

        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
          return;
        }

        const formattedAppointments = appointmentsData?.map(apt => ({
          id: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          service_name: (apt.services as any)?.name || 'Serviço',
          client_name: (apt.clients as any)?.name || 'Cliente'
        })) || [];

        setAppointments(formattedAppointments);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarberData();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">
            Carregando agenda...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agenda de {barberInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberScheduleView;
