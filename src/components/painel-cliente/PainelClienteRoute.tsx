
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

  // Timeout de segurança - após 5 segundos, se ainda estiver carregando, forçar conclusão
  React.useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[PainelClienteRoute] Timeout de segurança atingido - forçando conclusão do loading');
        setTimeoutReached(true);
      }
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, [loading]);

  // Aguardar um tempo razoável antes de redirecionar
  React.useEffect(() => {
    if ((!loading || timeoutReached) && !cliente) {
      // Se não está carregando e não tem cliente, aguardar 1 segundo antes de redirecionar
      const timer = setTimeout(() => {
        console.log('[PainelClienteRoute] Sessão não encontrada, redirecionando para login');
        setShouldRedirect(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (cliente) {
      // Se o cliente foi carregado, garantir que não vai redirecionar
      setShouldRedirect(false);
    }
  }, [loading, cliente, timeoutReached]);

  // Se timeout foi atingido mas ainda loading, tratar como "não loading"
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
