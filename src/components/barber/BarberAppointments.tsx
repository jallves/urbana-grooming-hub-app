
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Calendar, User, Edit, CalendarX } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentForm from '@/components/barber/appointments/BarberAppointmentForm';

const BarberAppointmentsComponent: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    revenue: 0,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<Date | null>(null);
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
        
        // Calculate appointment stats
        const now = new Date();
        const completed = appointmentsData?.filter(a => a.status === 'completed') || [];
        const upcoming = appointmentsData?.filter(a => 
          a.status !== 'completed' && 
          a.status !== 'cancelled' && 
          new Date(a.start_time) > now
        ) || [];
        
        // Calculate revenue from completed appointments
        const revenue = completed.reduce((sum, app) => sum + Number(app.services?.price || 0), 0);
        
        setStats({
          total: appointmentsData?.length || 0,
          completed: completed.length,
          upcoming: upcoming.length,
          revenue: revenue
        });
        
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

  const handleEditAppointment = (appointmentId: string, startTime: string) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedAppointmentDate(new Date(startTime));
    setIsEditModalOpen(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success('Agendamento cancelado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Não foi possível cancelar o agendamento');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedAppointmentDate(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Agendamentos</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total de Agendamentos</p>
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Agendamentos Concluídos</p>
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.completed}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Próximos Agendamentos</p>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.upcoming}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Receita Total</p>
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.revenue)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="proximos" className="w-full">
        <TabsList>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proximos">
          {renderAppointmentList(appointments.filter(a => 
            a.status !== 'completed' && 
            a.status !== 'cancelled' && 
            new Date(a.start_time) > new Date()
          ))}
        </TabsContent>
        
        <TabsContent value="concluidos">
          {renderAppointmentList(appointments.filter(a => a.status === 'completed'))}
        </TabsContent>
        
        <TabsContent value="todos">
          {renderAppointmentList(appointments)}
        </TabsContent>
      </Tabs>

      {/* Edit Appointment Modal */}
      {isEditModalOpen && (
        <AppointmentForm
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          appointmentId={selectedAppointmentId || undefined}
          defaultDate={selectedAppointmentDate || undefined}
          dateTimeOnly={true} // Add flag to indicate only date/time should be editable
        />
      )}
    </div>
  );
  
  function renderAppointmentList(filteredAppointments: any[]) {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      );
    }
    
    if (filteredAppointments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum agendamento encontrado</p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
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
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-green-600 text-green-600 hover:bg-green-50 flex-1"
                      onClick={() => handleCompleteAppointment(appointment.id)}
                      disabled={updatingId === appointment.id}
                    >
                      {updatingId === appointment.id ? (
                        <Clock className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Finalizar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1"
                      onClick={() => handleEditAppointment(appointment.id, appointment.start_time)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      <CalendarX className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};

export default BarberAppointmentsComponent;
