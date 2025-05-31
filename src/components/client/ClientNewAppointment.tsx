
import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientAppointmentForm from '../appointment/ClientAppointmentForm';

interface ClientNewAppointmentProps {
  onSuccess: () => void;
}

export const ClientNewAppointment: React.FC<ClientNewAppointmentProps> = ({ onSuccess }) => {
  const { client } = useClientAuth();

  if (!client) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6 text-center">
          <p className="text-white">Carregando informações do cliente...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
      <CardHeader>
        <CardTitle className="text-white">Novo Agendamento</CardTitle>
        <CardDescription className="text-gray-300">
          Agende um novo serviço de acordo com sua disponibilidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClientAppointmentForm clientId={client.id} />
      </CardContent>
    </Card>
  );
};
