
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Scissors } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import NewClientAppointmentForm from '@/components/client/appointment/NewClientAppointmentForm';

export default function ClientNewAppointment() {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!client) {
    navigate('/cliente/login');
    return null;
  }

  const handleClose = () => {
    setIsFormOpen(false);
    navigate('/cliente/dashboard');
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Novo Agendamento
            </h1>
            <p className="text-gray-400 font-inter">
              Agende seu horário com nossos barbeiros profissionais
            </p>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="bg-gray-900/90 border-gray-700 mb-8 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-400" />
              </div>
              Marcar Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Olá, <span className="font-semibold text-amber-400">{client.name}</span>! 
              </p>
              <p className="text-gray-400 text-sm">
                Selecione o serviço desejado, escolha a data e horário de sua preferência, 
                e nosso sistema mostrará automaticamente os barbeiros disponíveis.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Scissors className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">1. Escolha o Serviço</p>
                  <p className="text-xs text-gray-400">Corte, barba ou combo</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">2. Data e Hora</p>
                  <p className="text-xs text-gray-400">Selecione quando prefere</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <User className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">3. Barbeiro</p>
                  <p className="text-xs text-gray-400">Disponibilidade em tempo real</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleOpenForm}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-3 text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Abrir Formulário de Agendamento
            </Button>
          </CardContent>
        </Card>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/70 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-400" />
                Disponibilidade em Tempo Real
              </h3>
              <p className="text-gray-400 text-sm">
                Nosso sistema verifica automaticamente a disponibilidade dos barbeiros 
                conforme você seleciona data e horário, garantindo que só apareçam opções disponíveis.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/70 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                Profissionais Qualificados
              </h3>
              <p className="text-gray-400 text-sm">
                Todos os nossos barbeiros são profissionais experientes e qualificados, 
                prontos para oferecer o melhor atendimento e resultado.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Appointment Form */}
        <NewClientAppointmentForm 
          isOpen={isFormOpen}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
