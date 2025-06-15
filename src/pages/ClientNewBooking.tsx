// src/pages/cliente/ClientNewBooking.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';

import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';
import { LoaderPage } from '@/components/ui/loader-page';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scissors } from 'lucide-react';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [client, navigate]);

  if (isCheckingAuth) {
    return <LoaderPage />;
  }

  const containerClass = 'px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700">
        <div className={containerClass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="text-stone-100 hover:bg-stone-700/50 hover:text-white transition hover:scale-105"
              aria-label="Voltar para o dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Novo Agendamento</h1>
                <p className="text-stone-300">Reserve seu horário na barbearia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <div className={containerClass}>
          <Card className="bg-stone-800/50 border border-stone-700 rounded-2xl hover:shadow-lg transition">
            <CardHeader className="border-b border-stone-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-amber-500" />
                Novo Agendamento
              </CardTitle>
              <CardDescription className="text-stone-400">
                No momento, o agendamento online está desativado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex justify-center items-center min-h-[180px]">
              <div className="text-xl text-center text-stone-300 py-10">
                O formulário de agendamento foi removido.<br />
                Por favor, entre em contato pelo WhatsApp ou presencialmente para agendar um horário.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
