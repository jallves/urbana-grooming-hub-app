
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Calendar, Clock, User, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  service_id: string;
  staff_id: string;
  client_id: string;
  services?: {
    name: string;
    price: number;
    duration: number;
  };
  barbers?: {
    name: string;
  };
}

const ClientEditAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
    
    if (id) {
      fetchAppointment();
    }
  }, [client, id, navigate]);

  const fetchAppointment = async () => {
    if (!id || !client) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, price, duration),
          barbers (name)
        `)
        .eq('id', id)
        .eq('client_id', client.id)
        .single();

      if (error) throw error;

      // Transform the data to match expected format
      const transformedAppointment: Appointment = {
        ...data,
        services: data.services,
        barbers: data.barbers
      };

      setAppointment(transformedAppointment);
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do agendamento.",
        variant: "destructive",
      });
      navigate('/cliente/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });

      navigate('/cliente/dashboard');
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    }
  };

  if (!client) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Agendamento não encontrado</h1>
          <p className="mb-4">O agendamento solicitado não foi encontrado.</p>
          <Button onClick={() => navigate('/cliente/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            className="mr-4 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white font-clash">
              Detalhes do Agendamento
            </h1>
            <p className="text-[#9CA3AF] font-inter">
              Visualize e gerencie seu agendamento
            </p>
          </div>
        </div>

        <Card className="bg-[#111827] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Informações do Agendamento</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Status: {appointment.status === 'scheduled' ? 'Agendado' : 
                      appointment.status === 'confirmed' ? 'Confirmado' :
                      appointment.status === 'completed' ? 'Concluído' :
                      appointment.status === 'cancelled' ? 'Cancelado' : appointment.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Scissors className="h-5 w-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Serviço</p>
                    <p className="text-white font-medium">{appointment.services?.name}</p>
                    <p className="text-sm text-[#9CA3AF]">
                      R$ {appointment.services?.price.toFixed(2)} • {appointment.services?.duration} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Barbeiro</p>
                    <p className="text-white font-medium">{appointment.barbers?.name || 'A ser definido'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Data</p>
                    <p className="text-white font-medium">
                      {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Horário</p>
                    <p className="text-white font-medium">
                      {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} às{' '}
                      {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div>
                <p className="text-sm text-[#9CA3AF] mb-2">Observações</p>
                <p className="text-white bg-[#1F2937] p-3 rounded border border-gray-600">
                  {appointment.notes}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => navigate('/cliente/dashboard')}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Voltar
              </Button>
              
              {appointment.status === 'scheduled' && (
                <Button
                  onClick={handleCancelAppointment}
                  variant="destructive"
                  className="flex-1"
                >
                  Cancelar Agendamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientEditAppointment;
