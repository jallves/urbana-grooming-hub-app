
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';

interface Appointment {
  id: string;
  service_id: string;
  staff_id: string;
  start_time: string;
  notes?: string;
  services: {
    name: string;
    price: number;
  };
  staff: {
    name: string;
  };
}

export default function ClientEditAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!client?.id || !id) return;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            services (name, price),
            staff (name)
          `)
          .eq('id', id)
          .eq('client_id', client.id)
          .single();

        if (error) {
          console.error('Erro ao buscar agendamento:', error);
          setError('Agendamento não encontrado');
          return;
        }

        if (data) {
          setAppointment(data);
        }
      } catch (err) {
        console.error('Erro ao buscar agendamento:', err);
        setError('Erro ao carregar agendamento');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [client?.id, id]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-stone-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-stone-300 text-lg">Carregando agendamento...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
        <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/cliente/dashboard')}
                className="mr-4 text-stone-100 hover:bg-stone-700/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center px-6 py-16">
          <Card className="bg-red-900/20 border border-red-700 max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="text-red-400 text-4xl mb-4">⚠</div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">
                {error || 'Agendamento não encontrado'}
              </h3>
              <p className="text-red-300 mb-4">
                Não foi possível carregar o agendamento solicitado.
              </p>
              <Button 
                onClick={() => navigate('/cliente/dashboard')}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.start_time);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4 text-stone-100 hover:bg-stone-700/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Editar Agendamento
                </h1>
                <p className="text-stone-300">
                  {appointment.services?.name} - {appointment.staff?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <Card className="bg-stone-800/50 border border-stone-700 rounded-lg">
            <CardHeader className="border-b border-stone-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Modificar seu agendamento
              </CardTitle>
              <CardDescription className="text-stone-400">
                Altere os detalhes do seu agendamento conforme necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ClientAppointmentForm 
                clientId={client.id}
                appointmentId={id}
                initialData={{
                  serviceId: appointment.service_id,
                  staffId: appointment.staff_id,
                  date: appointmentDate,
                  notes: appointment.notes || '',
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
