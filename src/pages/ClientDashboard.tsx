
import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  Plus,
  LogOut,
  Settings,
  History,
  MapPin,
  Phone,
  Scissors
} from 'lucide-react';

const ClientDashboard = () => {
  const { client, signOut, loading } = useClientAuth();
  const navigate = useNavigate();

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['client-appointments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, services (name, duration, price), staff (name)`)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!client?.id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-300/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/cliente/login" replace />;
  }

  const upcomingAppointments = appointments?.filter(
    apt => new Date(apt.start_time) > new Date() && apt.status !== 'cancelled'
  ) || [];

  const pastAppointments = appointments?.filter(
    apt => new Date(apt.start_time) <= new Date() || apt.status === 'completed'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-600 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Olá, {client.name}!
                </h1>
                <p className="text-sm text-gray-500">Bem-vindo à sua barbearia</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/cliente/perfil')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-yellow-100 border-yellow-300 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Corte
              </CardTitle>
              <CardDescription className="text-gray-600">
                Agende seu próximo serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold"
                onClick={() => navigate('/cliente/novo-agendamento')}
              >
                Agendar Agora
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Cortes
              </CardTitle>
              <CardDescription className="text-gray-600">
                Seus agendamentos confirmados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {upcomingAppointments.length}
              </div>
              <p className="text-sm text-gray-500">
                {upcomingAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico
              </CardTitle>
              <CardDescription className="text-gray-600">
                Serviços realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {pastAppointments.length}
              </div>
              <p className="text-sm text-gray-500">
                {pastAppointments.length === 1 ? 'corte' : 'cortes'} realizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-yellow-500" />
            Próximos Agendamentos
          </h2>

          {appointmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {appointment.services?.name}
                        </h3>
                        <Badge className={`${getStatusColor(appointment.status)} border`}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">
                          R$ {appointment.services?.price?.toFixed(2)}
                        </p>
                        {appointment.discount_amount > 0 && (
                          <p className="text-green-600 text-sm">
                            Desconto: R$ {appointment.discount_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}
                          {appointment.services?.duration && ` (${appointment.services.duration} min)`}
                        </span>
                      </div>
                      {appointment.staff && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{appointment.staff.name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-8 text-center">
                <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum corte agendado
                </h3>
                <p className="text-gray-500 mb-4">
                  Está na hora de marcar seu próximo corte!
                </p>
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold"
                  onClick={() => navigate('/cliente/novo-agendamento')}
                >
                  Agendar Corte
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Information */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-yellow-500" />
              Nossa Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Phone className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">Telefone</p>
                <p className="text-gray-600">(11) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">Endereço</p>
                <p className="text-gray-600">Rua Example, 123 - Centro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
