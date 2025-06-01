
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Plus, LogOut, Edit, Trash2, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { client, signOut } = useClientAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
    fetchAppointments();
  }, [client, navigate]);

  const fetchAppointments = async () => {
    if (!client) return;

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
        .eq('client_id', client.id)
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
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      {isMobile ? (
        <div className="bg-black border-b border-gray-700 sticky top-0 z-40">
          <div className="flex justify-between items-center px-4 py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">Painel</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate('/cliente/novo-agendamento')}
                size="sm"
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-black"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 bg-black border-b border-gray-700 z-30">
              <div className="px-4 py-2 space-y-2">
                <p className="text-gray-300 text-sm">Olá, {client?.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut();
                  }}
                  className="w-full justify-start text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Header */
        <div className="bg-black border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Painel do Cliente</h1>
                <p className="text-gray-300">Bem-vindo, {client?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/cliente/novo-agendamento')}
                  className="bg-urbana-gold hover:bg-urbana-gold/90 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button variant="outline" onClick={signOut} className="border-gray-600 text-white hover:bg-gray-800">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`${isMobile ? 'px-4 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} bg-black`}>
        {/* Statistics Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-6'} mb-8`}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-urbana-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{appointments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Próximos Agendamentos</CardTitle>
              <Clock className="h-4 w-4 text-urbana-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {appointments.filter(apt => 
                  new Date(apt.start_time) > new Date() && 
                  apt.status !== 'cancelled'
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Agendamentos Concluídos</CardTitle>
              <User className="h-4 w-4 text-urbana-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {appointments.filter(apt => apt.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Seus Agendamentos</CardTitle>
            <CardDescription className="text-gray-300">
              Histórico e próximos agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-300 mb-4">
                  Você ainda não tem agendamentos. Que tal marcar seu primeiro horário?
                </p>
                <Button 
                  onClick={() => navigate('/cliente/novo-agendamento')}
                  className="bg-urbana-gold hover:bg-urbana-gold/90 text-black"
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
                    className={`border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-800 ${
                      isMobile ? 'mobile-appointment-card' : ''
                    }`}
                  >
                    <div className={`${isMobile ? 'space-y-3' : 'flex justify-between items-start'} mb-3`}>
                      <div className="flex-1">
                        <div className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-3'} mb-2`}>
                          <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
                            {appointment.service.name}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className={`text-sm text-gray-300 ${isMobile ? 'space-y-2' : 'space-y-1'}`}>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                            {format(new Date(appointment.start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-urbana-gold" />
                            {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
                          </div>
                          {appointment.staff && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-urbana-gold" />
                              {appointment.staff.name}
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-300">
                            <strong>Observações:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>

                      <div className={`${isMobile ? 'flex justify-between items-center' : 'text-right'}`}>
                        <div>
                          <div className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>
                            R$ {calculateFinalPrice(appointment).toFixed(2)}
                          </div>
                          {appointment.discount_amount > 0 && (
                            <div className="text-sm text-green-400">
                              Desconto: R$ {appointment.discount_amount.toFixed(2)}
                              {appointment.coupon_code && ` (${appointment.coupon_code})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {appointment.status === 'scheduled' && new Date(appointment.start_time) > new Date() && (
                      <div className={`${isMobile ? 'flex space-x-2' : 'flex justify-end space-x-2'} pt-3 border-t border-gray-700`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/cliente/agendamento/${appointment.id}/editar`)}
                          className={`border-gray-600 text-white hover:bg-gray-700 ${isMobile ? 'flex-1' : ''}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className={isMobile ? 'flex-1' : ''}
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
