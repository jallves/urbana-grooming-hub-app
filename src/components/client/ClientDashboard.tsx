
import React, { useState } from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, User, History, LogOut } from 'lucide-react';
import { ClientAppointmentsList } from './ClientAppointmentsList';
import { ClientNewAppointment } from './ClientNewAppointment';
import { ClientProfile } from './ClientProfile';
import { ClientAppointmentHistory } from './ClientAppointmentHistory';

export const ClientDashboard = () => {
  const { client, signOut } = useClientAuth();
  const [activeTab, setActiveTab] = useState('appointments');

  const handleSignOut = async () => {
    await signOut();
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-urbana-dark via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-urbana-gold/20">
          <CardContent className="p-6 text-center">
            <p className="text-white">Carregando informações do cliente...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-urbana-dark via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Olá, {client.name}!</h1>
            <p className="text-gray-300">Gerencie seus agendamentos</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-urbana-gold">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="new-appointment" className="data-[state=active]:bg-urbana-gold">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-urbana-gold">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-urbana-gold">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-6">
            <ClientAppointmentsList />
          </TabsContent>

          <TabsContent value="new-appointment" className="mt-6">
            <ClientNewAppointment onSuccess={() => setActiveTab('appointments')} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ClientAppointmentHistory />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ClientProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
