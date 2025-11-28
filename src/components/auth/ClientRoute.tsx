import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoaderPage } from '@/components/ui/loader-page';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

interface ClientRouteProps {
  children: React.ReactNode;
}

/**
 * Guard para rotas do painel do cliente
 * Apenas clientes autenticados podem acessar
 */
const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  const { user, isClient, loading, rolesChecked } = useAuth();
  const location = useLocation();

  // CRÍTICO: Durante loading, NUNCA redirecionar - apenas aguardar
  if (loading || !rolesChecked) {
    return <LoaderPage />;
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    return <Navigate to="/painel-cliente/login" replace />;
  }

  // Se não é cliente, redirecionar para login
  if (!isClient) {
    return <Navigate to="/painel-cliente/login" replace />;
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
};

export default ClientRoute;
