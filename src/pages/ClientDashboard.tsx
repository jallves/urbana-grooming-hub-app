
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, User, Settings, Scissors } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ClientMetrics } from '@/components/cliente/dashboard/ClientMetrics';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, logout } = useClientAuth();

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Olá, {client.name}! 👋
            </h1>
            <p className="text-gray-400 font-inter">
              Gerencie seus agendamentos e acompanhe seu histórico
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              onClick={() => navigate('/cliente/novo-agendamento')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            
            <Button
              onClick={() => navigate('/cliente/perfil')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>
          </div>
        </div>

        {/* Botão Principal - Agendar Corte */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => navigate('/cliente/novo-agendamento')}>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-amber-500 rounded-full">
                  <Scissors className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Agendar Corte</h2>
                  <p className="text-gray-300 mb-4">
                    Marque seu horário com nossos barbeiros profissionais
                  </p>
                  <Button 
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Agendar Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas */}
        <ClientMetrics clientId={client.id} />

        {/* Próximos Agendamentos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-white">
                Próximos Agendamentos
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/cliente/agendamentos')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Ver Todos
            </Button>
          </div>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <p className="text-gray-400 text-center">
                Seus próximos agendamentos aparecerão aqui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="bg-gray-900 border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all"
            onClick={() => navigate('/cliente/agendamentos')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Meus Agendamentos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Visualize e gerencie seus agendamentos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="bg-gray-900 border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all"
            onClick={() => navigate('/cliente/perfil')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                Meu Perfil
              </CardTitle>
              <CardDescription className="text-gray-400">
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Configurações
              </CardTitle>
              <CardDescription className="text-gray-400">
                Personalize suas preferências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={logout}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
