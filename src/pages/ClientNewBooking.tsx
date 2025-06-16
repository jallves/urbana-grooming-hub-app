// src/pages/cliente/ClientNewBooking.tsx

import React, { useEffect } from 'react';
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
  const { client, loading: authLoading } = useClientAuth();

  useEffect(() => {
    // Redireciona imediatamente se não houver cliente autenticado
    if (!authLoading && !client) {
      navigate('/cliente/login');
    }
  }, [client, authLoading, navigate]);

  if (authLoading || !client) {
    return <LoaderPage />;
  }

  const containerClass = 'px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700 sticky top-0 z-10">
        <div className={containerClass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/cliente/dashboard')}
              className="text-stone-100 hover:bg-stone-700/50 hover:text-white transition hover:scale-105 group"
              aria-label="Voltar para o dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Scissors className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Novo Agendamento</h1>
                <p className="text-stone-300">Reserve seu horário na barbearia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8 animate-fade-in">
        <div className={containerClass}>
          <Card className="bg-stone-800/50 border border-stone-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-stone-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-amber-500" />
                Novo Agendamento
              </CardTitle>
              <CardDescription className="text-stone-400">
                Preencha o formulário para agendar seu próximo corte!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ClientAppointmentForm clientId={client.id} />
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-stone-800/30 border-stone-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Horários Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-stone-300 space-y-2">
                  <li>Segunda a Sexta: 9h às 20h</li>
                  <li>Sábado: 8h às 18h</li>
                  <li>Domingo: Fechado</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-stone-800/30 border-stone-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Política de Cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-300">
                  Cancelamentos devem ser feitos com pelo menos 24h de antecedência.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-stone-800/30 border-stone-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-300">
                  Dúvidas? Entre em contato: (11) 99999-9999
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}