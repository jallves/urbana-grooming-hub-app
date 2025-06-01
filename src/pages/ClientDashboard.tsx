
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, Mail, LogOut, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  staff?: {
    name: string;
  };
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, user, signOut, loading: authLoading } = useClientAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!client) {
      console.log('No client found, skipping appointment fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching appointments for client:', client.id);
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('appointments')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        console.error('Database connection test failed:', testError);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao banco de dados.",
          variant: "destructive",
        });
        return;
      }

      console.log('Database connection OK, fetching appointments...');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          service:services(name, price, duration),
          staff(name)
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Erro",
          description: `Erro ao carregar agendamentos: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Appointments fetched successfully:', data?.length || 0, 'appointments');
      setAppointments(data || []);
    } catch (error) {
      console.error('Unexpected error fetching appointments:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    console.log('Dashboard useEffect - authLoading:', authLoading, 'user:', !!user, 'client:', !!client);
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/cliente/login');
      return;
    }

    if (client && !authLoading) {
      console.log('Client found, fetching appointments');
      fetchAppointments();
    }
  }, [client, user, authLoading, navigate, fetchAppointments]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default">Agendado</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Confirmado</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-500">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0];
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-gray-600">
              {!user ? 'Usuário não autenticado.' : 'Carregando perfil do cliente...'}
            </p>
          </div>
          {!user && (
            <Button onClick={() => navigate('/cliente/login')}>
              Fazer Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {getFirstName(client.name)}! 👋
              </h1>
              <p className="text-gray-600">Bem-vindo ao seu dashboard pessoal</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/cliente/novo-agendamento')}
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </p>
                </div>
                {client.birth_date && (
                  <div>
                    <p className="text-sm text-gray-600">Data de Nascimento</p>
                    <p className="font-medium">
                      {format(new Date(client.birth_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Meus Agendamentos
                </CardTitle>
                <CardDescription>
                  Acompanhe seus agendamentos e horários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando agendamentos...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Você ainda não tem agendamentos</p>
                    <Button
                      onClick={() => navigate('/cliente/novo-agendamento')}
                      className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Fazer Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{appointment.service.name}</h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(appointment.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                              </div>
                              {appointment.staff && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {appointment.staff.name}
                                </div>
                              )}
                            </div>

                            {appointment.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <strong>Observações:</strong> {appointment.notes}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-urbana-gold">
                              R$ {appointment.service.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.service.duration} min
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
