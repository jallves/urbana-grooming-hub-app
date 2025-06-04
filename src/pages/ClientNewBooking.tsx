// src/pages/client/new-booking.tsx
import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { BarberProvider } from '@/pages/admin/barbers';
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
import BarberSelection from '@/components/appointment/BarberSelection';

const ClientNewBooking: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const isMobile = useIsMobile();
  const { barbers } = useContext(BarberProvider);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
    }
  }, [client, navigate]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-stone-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700">
        <div className={`${isMobile ? 'px-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex items-center ${isMobile ? 'py-4' : 'py-6'}`}>
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="mr-4 text-stone-100 hover:bg-stone-700/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6 text-amber-500" />
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                  Novo Agendamento
                </h1>
                <p className="text-stone-300">Reserve seu horário na barbearia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex justify-center ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        <div className={`w-full ${isMobile ? '' : 'max-w-4xl'}`}>
          <Card className="bg-stone-800/50 border border-stone-700 rounded-lg">
            <CardHeader className="border-b border-stone-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-amber-500" />
                Escolha seu serviço
              </CardTitle>
              <CardDescription className="text-stone-400">
                Selecione o tipo de corte e horário disponível
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <BarberSelection 
                barbers={barbers} 
                clientId={client.id} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientNewBooking;