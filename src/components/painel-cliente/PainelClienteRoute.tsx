import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { PainelClienteLoadingScreen } from './PainelClienteLoadingScreen';

interface PainelClienteRouteProps {
  children: React.ReactNode;
}

const PainelClienteRoute: React.FC<PainelClienteRouteProps> = ({ children }) => {
  const { session, authLoading } = usePainelClienteAuth();

  // REGRA 1: Enquanto estiver carregando, mostrar loading
  if (authLoading) {
    return <PainelClienteLoadingScreen />;
  }

  // REGRA 2: Só redirecionar quando authLoading === false E session === null
  if (!authLoading && !session) {
    console.log('[PainelClienteRoute] Sem sessão - redirecionando para login');
    return <Navigate to="/painel-cliente/login" replace />;
  }

  // REGRA 3: Se tem sessão, renderizar conteúdo protegido
  return <>{children}</>;
};

export default PainelClienteRoute;
