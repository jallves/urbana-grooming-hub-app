
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const BarberAppointmentsComponent: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching appointments for user:', user.email);
        
        // Primeiro tenta encontrar o registro de staff correspondente ao email do usuário
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (staffError) {
          console.error('Erro ao buscar dados do profissional:', staffError);
          setLoading(false);
          return;
        }
        
        if (!staffData) {
          console.log('Nenhum registro de profissional encontrado para este usuário');
          setLoading(false);
          return;
        }
        
        // Buscar os agendamentos para este barbeiro
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            services:service_id (*),
            clients:client_id (*)
          `)
          .eq('staff_id', staffData.id)
          .order('start_time', { ascending: true });
          
        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
        } else {
          console.log('Agendamentos encontrados:', appointmentsData?.length || 0);
          setAppointments(appointmentsData || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Agendamentos</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <p className="font-medium">{appointment.clients?.name || 'Cliente não identificado'}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'canceled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status === 'completed' ? 'Concluído' :
                       appointment.status === 'canceled' ? 'Cancelado' :
                       appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(appointment.start_time).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="font-medium">{appointment.services?.name || 'Serviço não especificado'}</p>
                  {appointment.notes && <p className="text-sm text-gray-600">"{appointment.notes}"</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Você não tem agendamentos.</p>
        </div>
      )}
    </div>
  );
};

export default BarberAppointmentsComponent;
