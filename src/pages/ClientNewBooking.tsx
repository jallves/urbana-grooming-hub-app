
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ClientNewBooking() {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!client) {
      console.log('Cliente não autenticado, redirecionando para login');
      navigate('/cliente/login');
    }
  }, [client, navigate]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className={`${isMobile ? 'px-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex items-center ${isMobile ? 'py-4' : 'py-6'}`}>
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>Novo Agendamento</h1>
              <p className="text-gray-300">Agende seu horário na barbearia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex justify-center items-start min-h-[calc(100vh-120px)] py-8">
        <ClientAppointmentForm clientId={client.id} />
      </div>
    </div>
  );
}
