import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { LoaderPage } from '@/components/ui/loader-page';

interface TotemProtectedRouteProps {
  children: React.ReactNode;
}

const TotemProtectedRoute: React.FC<TotemProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useTotemAuth();
  const location = useLocation();

  // Persistência de rota: salvar rota atual quando mudar (somente se autenticado)
  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      localStorage.setItem('totem_last_route', location.pathname);
    }
  }, [location.pathname, loading, isAuthenticated]);

  // CRÍTICO: Durante loading, NUNCA redirecionar
  if (loading) {
    return <LoaderPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/totem/login" replace />;
  }

  return <>{children}</>;
};

export default TotemProtectedRoute;
