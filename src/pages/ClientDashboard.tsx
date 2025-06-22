
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useClientAppointments } from '@/hooks/useClientAppointments';
import AppointmentCard from '@/components/client/AppointmentCard';
import { Calendar, User, LogOut, Plus, Clock, History } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, signOut } = useClientAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!client) {
    navigate('/cliente/login');
    return null;
  }

  const { 
    appointments, 
    loading, 
    cancelAppointment, 
    deleteAppointment 
  } = useClientAppointments(client.id);

  const handleSignOut = async () => {
    await signOut();
    navigate('/agendamento-online');
  };

  const handleNewBooking = () => {
    navigate('/cliente/novo-agendamento');
  };

  const handleEditAppointment = (appointmentId: string) => {
    navigate(`/cliente/editar-agendamento/${appointmentId}`);
  };

  // Separar agendamentos futuros e histórico
  const now = new Date();
  const futureAppointments = appointments.filter(
    appointment => new Date(appointment.start_time) > now && 
    appointment.status !== 'cancelled' && 
    appointment.status !== 'completed'
  );

  const pastAppointments = appointments.filter(
    appointment => new Date(appointment.start_time) <= now || 
    appointment.status === 'cancelled' || 
    appointment.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash">
              Bem-vindo, {client.name.split(' ')[0]}!
            </h1>
            <p className="text-[#9CA3AF] font-inter">
              Gerencie seus agendamentos na barbearia
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#111827] border-gray-700">
            <TabsTrigger 
              value="profile" 
              className="text-gray-300 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="text-gray-300 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-gray-300 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black"
            >
              <History className="mr-2 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#111827] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="mr-2 h-5 w-5 text-[#F59E0B]" />
                    Meu Perfil
                  </CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    Informações da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[#9CA3AF]">
                    <p><span className="font-medium">Nome:</span> {client.name}</p>
                    <p><span className="font-medium">Email:</span> {client.email}</p>
                    <p><span className="font-medium">WhatsApp:</span> {client.whatsapp || client.phone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111827] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Ações Rápidas</CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    O que você gostaria de fazer?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      onClick={handleNewBooking}
                      className="bg-[#F59E0B] hover:bg-[#D97706] text-black"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agendar Novo Horário
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      onClick={() => navigate('/cliente/perfil')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <Card className="bg-[#111827] border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-[#F59E0B]" />
                      Próximos Agendamentos
                    </CardTitle>
                    <CardDescription className="text-[#9CA3AF]">
                      Seus agendamentos futuros
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleNewBooking}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-black"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
                    <span className="ml-2 text-[#9CA3AF]">Carregando agendamentos...</span>
                  </div>
                ) : futureAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#9CA3AF] mb-4">
                      Você não possui agendamentos futuros
                    </p>
                    <Button 
                      onClick={handleNewBooking}
                      className="bg-[#F59E0B] hover:bg-[#D97706] text-black"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Fazer Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {futureAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={handleEditAppointment}
                        onCancel={cancelAppointment}
                        onDelete={deleteAppointment}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-[#111827] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History className="mr-2 h-5 w-5 text-[#F59E0B]" />
                  Histórico de Agendamentos
                </CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Seus agendamentos anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
                    <span className="ml-2 text-[#9CA3AF]">Carregando histórico...</span>
                  </div>
                ) : pastAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#9CA3AF]">
                      Nenhum agendamento encontrado no histórico
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pastAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={handleEditAppointment}
                        onCancel={cancelAppointment}
                        onDelete={deleteAppointment}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
