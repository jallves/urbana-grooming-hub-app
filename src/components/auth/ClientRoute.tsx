
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ClientRouteProps {
  children: React.ReactNode;
}

export default function ClientRoute({ children }: ClientRouteProps) {
  const { user, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/cliente/login" replace />;
  }

  return <>{children}</>;
}
