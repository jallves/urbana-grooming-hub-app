
import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Navigate } from 'react-router-dom';
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
  Star,
  MapPin,
  Phone
} from 'lucide-react';

const ClientDashboard = () => {
  const { client, signOut, loading } = useClientAuth();

  // Fetch client appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['client-appointments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, duration, price),
          staff (name)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!client?.id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/cliente/login" replace />;
  }

  const upcomingAppointments = appointments?.filter(apt => 
    new Date(apt.start_time) > new Date() && apt.status !== 'cancelled'
  ) || [];

  const pastAppointments = appointments?.filter(apt => 
    new Date(apt.start_time) <= new Date() || apt.status === 'completed'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Olá, {client.name}!
                </h1>
                <p className="text-sm text-gray-400">Bem-vindo ao seu painel</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="bg-transparent border-red-400/20 text-red-400 hover:bg-red-400/10"
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
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Agendamento
              </CardTitle>
              <CardDescription className="text-gray-300">
                Reserve seu próximo horário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                onClick={() => window.location.href = '/cliente/novo-agendamento'}
              >
                Agendar Agora
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Agendamentos
              </CardTitle>
              <CardDescription className="text-gray-300">
                Seus horários confirmados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {upcomingAppointments.length}
              </div>
              <p className="text-sm text-gray-400">
                {upcomingAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico
              </CardTitle>
              <CardDescription className="text-gray-300">
                Serviços realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {pastAppointments.length}
              </div>
              <p className="text-sm text-gray-400">
                {pastAppointments.length === 1 ? 'serviço' : 'serviços'} realizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-amber-500" />
            Próximos Agendamentos
          </h2>
          
          {appointmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-3 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {appointment.services?.name}
                        </h3>
                        <Badge className={`${getStatusColor(appointment.status)} border`}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          R$ {appointment.services?.price?.toFixed(2)}
                        </p>
                        {appointment.discount_amount > 0 && (
                          <p className="text-green-400 text-sm">
                            Desconto: R$ {appointment.discount_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-gray-300">
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
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhum agendamento próximo
                </h3>
                <p className="text-gray-400 mb-4">
                  Que tal agendar um horário para cuidar de você?
                </p>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                  onClick={() => window.location.href = '/cliente/novo-agendamento'}
                >
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Phone className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">Telefone</p>
                <p className="text-gray-300">(11) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <MapPin className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">Endereço</p>
                <p className="text-gray-300">Rua Example, 123 - Centro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
