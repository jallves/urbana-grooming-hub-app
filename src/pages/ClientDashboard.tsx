
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useClientAppointments } from '@/hooks/useClientAppointments';
import { AppointmentCard } from '@/components/client/AppointmentCard';
import { Calendar, User, LogOut, Plus, Clock, History } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, signOut } = useClientAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const {
    futureAppointments,
    pastAppointments,
    loading,
    cancelAppointment,
    deleteAppointment
  } = useClientAppointments(client?.id || '');

  if (!client) {
    navigate('/cliente/login');
    return null;
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-white flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-[#F59E0B]" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : futureAppointments.length}
              </div>
              <p className="text-sm text-[#9CA3AF]">
                agendamentos futuros
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#111827] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <History className="mr-2 h-5 w-5 text-[#F59E0B]" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : pastAppointments.length}
              </div>
              <p className="text-sm text-[#9CA3AF]">
                agendamentos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#111827] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Ação Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleNewBooking}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#111827] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Meus Agendamentos</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Gerencie seus horários marcados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Próximos ({futureAppointments.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black"
                >
                  <History className="mr-2 h-4 w-4" />
                  Histórico ({pastAppointments.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-6">
                {loading ? (
                  <div className="text-center text-[#9CA3AF] py-8">
                    Carregando agendamentos...
                  </div>
                ) : futureAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Nenhum agendamento futuro
                    </h3>
                    <p className="text-[#9CA3AF] mb-4">
                      Você não possui agendamentos marcados
                    </p>
                    <Button 
                      onClick={handleNewBooking}
                      className="bg-[#F59E0B] hover:bg-[#D97706] text-black"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agendar Agora
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </TabsContent>
              
              <TabsContent value="history" className="mt-6">
                {loading ? (
                  <div className="text-center text-[#9CA3AF] py-8">
                    Carregando histórico...
                  </div>
                ) : pastAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Nenhum histórico encontrado
                    </h3>
                    <p className="text-[#9CA3AF]">
                      Você ainda não possui agendamentos realizados
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
