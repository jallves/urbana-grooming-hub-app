import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import ClientAppointmentForm from '@/components/client/appointment/ClientAppointmentForm';

export default function ClientNewAppointment() {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const [isFormOpen, setIsFormOpen] = useState(true);

  if (!client) {
    navigate('/cliente/login');
    return null;
  }

  const handleClose = () => {
    setIsFormOpen(false);
    navigate('/cliente/dashboard');
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Novo Agendamento
            </h1>
            <p className="text-gray-400 font-inter">
              Agende seu horário com nossos barbeiros
            </p>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-amber-500" />
              Marcar Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Olá, <span className="font-semibold text-white">{client.name}</span>! 
              Selecione o serviço, data, horário e barbeiro de sua preferência.
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Abrir Formulário de Agendamento
            </Button>
          </CardContent>
        </Card>

        {/* Appointment Form */}
        <ClientAppointmentForm 
          isOpen={isFormOpen}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}