
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Calendar, User, LogOut, Plus } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, signOut } = useClientAuth();

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

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                Meus Agendamentos
              </CardTitle>
              <CardDescription className="text-[#9CA3AF]">
                Visualize seus horários marcados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[#9CA3AF] text-sm mb-4">
                Você não possui agendamentos ativos
              </p>
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
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              O que você gostaria de fazer?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
