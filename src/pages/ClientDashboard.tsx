import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Plus, LogOut, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  coupon_code: string | null;
  discount_amount: number;
  service: {
    name: string;
    price: number;
  };
  staff: {
    name: string;
  } | null;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, user, signOut, loading: authLoading } = useClientAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/cliente/login');
      return;
    }
    if (user) {
      fetchAppointments();
    }
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    if (!user) return;

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
          service:services(name, price),
          staff:staff(name)
        `)
        .eq('client_id', user.id)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus agendamentos.",
          variant: "destructive",
        });
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('client_id', user.id); // Ensure user can only cancel their own appointments

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Agendamento cancelado",
          description: "Seu agendamento foi cancelado com sucesso.",
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: 'Agendado', variant: 'default' as const },
      confirmed: { label: 'Confirmado', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const calculateFinalPrice = (appointment: Appointment) => {
    return appointment.service.price - (appointment.discount_amount || 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Painel do Cliente</h1>
              <p className="text-gray-600 text-sm sm:text-base">Bem-vindo, {client?.name || user.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Button
                onClick={() => navigate('/cliente/novo-agendamento')}
                className="bg-urbana-gold hover:bg-urbana-gold/90 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
              <Button variant="outline" onClick={signOut} size="sm" className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(apt => 
                  new Date(apt.start_time) > new Date() && 
                  apt.status !== 'cancelled'
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Concluídos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(apt => apt.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Seus Agendamentos</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Histórico e próximos agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Você ainda não tem agendamentos. Que tal marcar seu primeiro horário?
                </p>
                <Button 
                  onClick={() => navigate('/cliente/novo-agendamento')}
                  className="bg-urbana-gold hover:bg-urbana-gold/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 space-y-2 sm:space-y-0">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {appointment.service.name}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">
                              {format(new Date(appointment.start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>
                              {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
                            </span>
                          </div>
                          {appointment.staff && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="break-words">{appointment.staff.name}</span>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Observações:</strong> <span className="break-words">{appointment.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="text-lg font-semibold">
                          R$ {calculateFinalPrice(appointment).toFixed(2)}
                        </div>
                        {appointment.discount_amount > 0 && (
                          <div className="text-sm text-green-600">
                            Desconto: R$ {appointment.discount_amount.toFixed(2)}
                            {appointment.coupon_code && ` (${appointment.coupon_code})`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {appointment.status === 'scheduled' && new Date(appointment.start_time) > new Date() && (
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/cliente/agendamento/${appointment.id}/editar`)}
                          className="w-full sm:w-auto"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
