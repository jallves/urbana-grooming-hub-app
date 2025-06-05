import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scissors } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

export default function ClientNewBooking() {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
    }
  }, [client, navigate]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className={`${isMobile ? 'px-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex items-center ${isMobile ? 'py-4' : 'py-6'}`}>
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4 text-gray-700 hover:bg-gray-100 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6 text-yellow-500" />
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                  Novo Agendamento
                </h1>
                <p className="text-gray-500">Reserve seu horário na barbearia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex justify-center ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        <div className={`w-full ${isMobile ? '' : 'max-w-4xl'}`}>
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-yellow-500" />
                Escolha seu serviço
              </CardTitle>
              <CardDescription className="text-gray-500">
                Selecione o tipo de corte e horário disponível
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ClientAppointmentForm clientId={client.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
