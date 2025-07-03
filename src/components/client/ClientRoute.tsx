
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
    return <Navigate to="/cliente/login" replace />;
  }

  return <>{children}</>;
};

export default ClientRoute;
