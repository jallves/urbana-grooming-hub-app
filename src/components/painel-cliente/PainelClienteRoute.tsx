
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

interface PainelClienteRouteProps {
  children: React.ReactNode;
}

const PainelClienteRoute: React.FC<PainelClienteRouteProps> = ({ children }) => {
  const { cliente, loading } = usePainelClienteAuth();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);
  const [timeoutReached, setTimeoutReached] = React.useState(false);

  // Timeout de segurança AUMENTADO - 8 segundos
  React.useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[PainelClienteRoute] ⏱️ Timeout atingido após 8s');
        setTimeoutReached(true);
      }
    }, 8000); // Aumentado de 5s para 8s

    return () => clearTimeout(safetyTimeout);
  }, [loading]);

  // Aguardar tempo razoável antes de redirecionar
  React.useEffect(() => {
    if ((!loading || timeoutReached) && !cliente) {
      // Reduzir espera de 1s para 500ms
      const timer = setTimeout(() => {
        console.log('[PainelClienteRoute] Redirecionando...');
        setShouldRedirect(true);
      }, 500);

      return () => clearTimeout(timer);
    } else if (cliente) {
      setShouldRedirect(false);
    }
  }, [loading, cliente, timeoutReached]);

  const isActuallyLoading = loading && !timeoutReached;

  if (isActuallyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-urbana-black">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="text-urbana-light/70">Carregando...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect && !cliente) {
    console.log('[PainelClienteRoute] Redirecionando para login');
    return <Navigate to="/painel-cliente/login" replace />;
  }

  if (!cliente && !shouldRedirect) {
    // Ainda aguardando definição se deve redirecionar
    return (
      <div className="flex items-center justify-center min-h-screen bg-urbana-black">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="text-urbana-light/70">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PainelClienteRoute;
