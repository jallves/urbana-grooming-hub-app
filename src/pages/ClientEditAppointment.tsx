
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  coupon_code: string | null;
  discount_amount: number;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    id: string;
    name: string;
  } | null;
}

export default function ClientEditAppointment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
    
    if (!id) {
      navigate('/cliente/dashboard');
      return;
    }

    fetchAppointment();
  }, [client, id, navigate]);

  const fetchAppointment = async () => {
    if (!client || !id) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          coupon_code,
          discount_amount,
          service:services(id, name, price, duration),
          staff:staff(id, name)
        `)
        .eq('id', id)
        .eq('client_id', client.id)
        .single();

      if (error) {
        console.error('Erro ao buscar agendamento:', error);
        toast({
          title: "Erro",
          description: "Agendamento não encontrado.",
          variant: "destructive",
        });
        navigate('/cliente/dashboard');
        return;
      }

      // Verificar se o agendamento pode ser editado
      const appointmentDate = new Date(data.start_time);
      const now = new Date();
      
      if (appointmentDate <= now || data.status !== 'scheduled') {
        toast({
          title: "Não é possível editar",
          description: "Este agendamento não pode mais ser editado.",
          variant: "destructive",
        });
        navigate('/cliente/dashboard');
        return;
      }

      setAppointment(data);
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o agendamento.",
        variant: "destructive",
      });
      navigate('/cliente/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-urbana-gold mx-auto mb-4" />
          <p className="text-gray-600">Carregando agendamento...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Agendamento não encontrado</CardTitle>
            <CardDescription>
              O agendamento que você está tentando editar não foi encontrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/cliente/dashboard')}
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Agendamento</h1>
              <p className="text-gray-600">Modifique os detalhes do seu agendamento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamento Atual</CardTitle>
              <CardDescription>
                Informações do agendamento que será modificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{appointment.service.name}</p>
                  <p className="text-sm text-gray-600">
                    R$ {appointment.service.price.toFixed(2)} - {appointment.service.duration} min
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {format(new Date(appointment.start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(appointment.start_time), "EEEE", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
                  </p>
                </div>
              </div>

              {appointment.staff && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Profissional</p>
                    <p className="text-sm text-gray-600">{appointment.staff.name}</p>
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <p className="font-medium mb-1">Observações</p>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Agendamento</CardTitle>
              <CardDescription>
                Selecione as novas informações para seu agendamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client && <ClientAppointmentForm clientId={client.id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
