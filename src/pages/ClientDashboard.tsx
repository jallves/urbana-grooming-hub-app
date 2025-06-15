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
import { ClientSidebar } from "@/components/client/ClientSidebar";

const ClientDashboard = () => {
  const { client, signOut, loading } = useClientAuth();
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4"></div>
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
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
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
    <div className="min-h-screen bg-urbana-black flex flex-col md:flex-row">
      <ClientSidebar />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-urbana-black border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-urbana-gold to-urbana-gold/80 rounded-full flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-urbana-black" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white font-playfair">
                    Olá, {client.name}!
                  </h1>
                  <p className="text-sm text-gray-400">Bem-vindo à sua barbearia</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => navigate('/cliente/perfil')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={signOut}
                  className="bg-transparent border-red-600 text-red-400 hover:bg-red-900/20"
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
            <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 border-urbana-gold/30 hover:shadow-lg hover:shadow-urbana-gold/20 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-black flex items-center gap-2 font-playfair">
                  <Plus className="h-5 w-5" />
                  Novo Corte
                </CardTitle>
                <CardDescription className="text-black">
                  Agende seu próximo serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold"
                  onClick={() => navigate('/cliente/novo-agendamento')}
                >
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 font-playfair">
                  <Calendar className="h-5 w-5" />
                  Próximos Cortes
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Seus agendamentos confirmados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-urbana-gold mb-1">
                  {upcomingAppointments.length}
                </div>
                <p className="text-sm text-gray-400">
                  {upcomingAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 font-playfair">
                  <History className="h-5 w-5" />
                  Histórico
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Serviços realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-urbana-gold mb-1">
                  {pastAppointments.length}
                </div>
                <p className="text-sm text-gray-400">
                  {pastAppointments.length === 1 ? 'corte' : 'cortes'} realizados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8" id="historico">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 font-playfair">
              <Calendar className="h-6 w-6 text-urbana-gold" />
              Próximos Agendamentos
            </h2>

            {appointmentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1 font-playfair">
                            {appointment.services?.name}
                          </h3>
                          <Badge className={`${getStatusColor(appointment.status)} border`}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-urbana-gold font-semibold">
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
              <Card className="bg-gray-900 border-gray-700 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Scissors className="h-12 w-12 text-urbana-gold/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2 font-playfair">
                    Nenhum corte agendado
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Está na hora de marcar seu próximo corte!
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold"
                    onClick={() => navigate('/cliente/novo-agendamento')}
                  >
                    Agendar Corte
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Nossa Barbearia - Contato e Rota */}
          <Card className="bg-gray-900 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-urbana-gold flex items-center gap-2 font-playfair text-xl">
                <MapPin className="h-5 w-5" />
                Costa Urbana
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-urbana-gold/20 rounded-lg">
                  <Phone className="h-5 w-5 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-urbana-gold font-medium">Telefone</p>
                  <p className="text-gray-300">2799778-0137</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-urbana-gold/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-urbana-gold font-medium">Endereço</p>
                  <p className="text-gray-300">
                    Rua Castelo Branco, 483 - Praia da Costa, Vila Velha - ES, 29101-480
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Button
                  className="w-full bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold"
                  onClick={() =>
                    window.open(
                      'https://www.google.com/maps/dir/?api=1&destination=Rua+Castelo+Branco,+483+-+Praia+da+Costa,+Vila+Velha+-+ES,+29101-480',
                      '_blank'
                    )
                  }
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Rota
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
