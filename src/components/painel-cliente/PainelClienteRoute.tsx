
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

interface PainelClienteRouteProps {
  children: React.ReactNode;
}

const PainelClienteRoute: React.FC<PainelClienteRouteProps> = ({ children }) => {
  const { cliente, isLoading } = usePainelClienteAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cliente) {
    return <Navigate to="/painel-cliente/login" replace />;
  }

  return <>{children}</>;
};

export default PainelClienteRoute;
