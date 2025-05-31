
import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ClientAuthForm } from '@/components/client/ClientAuthForm';
import { ClientDashboard } from '@/components/client/ClientDashboard';

const ClientAuth: React.FC = () => {
  const { user, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-urbana-dark via-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return user ? <ClientDashboard /> : <ClientAuthForm />;
};

export default ClientAuth;
