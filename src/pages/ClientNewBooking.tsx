
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
      navigate('/cliente/login');
    }
  }, [client, navigate]);

  if (!client) {
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
      {/* Header */}
      <div className="bg-black border-b border-gray-700">
        <div className={`${isMobile ? 'px-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex items-center ${isMobile ? 'py-4' : 'py-6'}`}>
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4 text-white hover:bg-gray-800"
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
      <div className={`${isMobile ? 'px-4 py-6' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} bg-black`}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-sm p-6">
          <ClientAppointmentForm clientId={client.id} />
        </div>
      </div>
    </div>
  );
}
