
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BarberAppointmentsComponent: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching appointments for user:', user.email);
      
      // First try to find the staff record corresponding to the user's email
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
      
      // Fetch appointments for this barber
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

  useEffect(() => {
    fetchAppointments();

    // Set up a subscription for real-time updates
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Appointment data changed:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success('Agendamento finalizado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Não foi possível atualizar o agendamento');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'confirmed': return 'Confirmado';
      default: return 'Agendado';
    }
  };

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
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(appointment.start_time)}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{appointment.services?.name || 'Serviço não especificado'}</p>
                    <p className="font-medium text-right">
                      R$ {Number(appointment.services?.price || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  {appointment.notes && <p className="text-sm text-gray-600 italic">"{appointment.notes}"</p>}
                  
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => handleCompleteAppointment(appointment.id)}
                      disabled={updatingId === appointment.id}
                    >
                      {updatingId === appointment.id ? (
                        <Clock className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Finalizar Atendimento
                    </Button>
                  )}
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
