import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoaderPage } from '@/components/ui/loader-page';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, LogOut } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

interface ClientRouteProps {
  children: React.ReactNode;
}

/**
 * Guard para rotas do painel do cliente
 * Apenas clientes autenticados podem acessar
 */
const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  const { user, isClient, loading, rolesChecked, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showTimeoutOptions, setShowTimeoutOptions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Timer para mostrar opções após 3 segundos de loading
  useEffect(() => {
    if (loading || !rolesChecked) {
      const timer = setTimeout(() => {
        setShowTimeoutOptions(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowTimeoutOptions(false);
    }
  }, [loading, rolesChecked]);

  // Se ainda está carregando mas passou do timeout, mostrar opções
  if ((loading || !rolesChecked) && showTimeoutOptions) {
    return (
      <AuthContainer
        title="Costa Urbana"
        subtitle="Carregamento Demorado"
      >
        <div className="w-full space-y-4">
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center space-y-2">
            <p className="text-yellow-500 font-semibold text-lg">⏱️ Demorando Muito?</p>
            <p className="text-urbana-light/80 text-sm">
              A verificação está demorando mais que o esperado.
            </p>
          </div>

          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar Página
          </Button>

          <Button
            onClick={async () => {
              setIsLoggingOut(true);
              localStorage.removeItem('client_last_route');
              await signOut();
              navigate('/painel-cliente/login');
            }}
            variant="outline"
            disabled={isLoggingOut}
            className="w-full border-red-500/30 bg-urbana-black/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 h-12 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair e Fazer Novo Login
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full text-urbana-light/60 hover:text-urbana-gold hover:bg-urbana-gold/10 h-12 rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Site
          </Button>
        </div>
      </AuthContainer>
    );
  }

  // CRÍTICO: Durante loading inicial (primeiros 3 segundos), apenas aguardar
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
