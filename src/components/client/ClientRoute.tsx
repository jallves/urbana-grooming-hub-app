
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ClientRouteProps {
  children: React.ReactNode;
}

const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  const { client, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Usuário não cadastrado</h2>
          <p className="text-muted-foreground">Por favor, faça o cadastro para acessar o sistema.</p>
          <Navigate to="/cliente/login" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ClientRoute;
