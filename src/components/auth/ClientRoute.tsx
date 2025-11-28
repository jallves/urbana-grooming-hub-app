import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  // Persistência de rota: salvar rota atual quando mudar (somente se autenticado)
  useEffect(() => {
    if (!loading && rolesChecked && user && isClient && location.pathname.startsWith('/painel-cliente/')) {
      console.log('[ClientRoute] 💾 Salvando rota:', location.pathname);
      localStorage.setItem('client_last_route', location.pathname);
    }
  }, [location.pathname, loading, rolesChecked, user, isClient]);

  // Mostrar loading enquanto verifica
  if (loading || !rolesChecked) {
    return <LoaderPage />;
  }

  // Se não há usuário, mostrar tela de acesso negado
  if (!user) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Acesso Negado">
        <div className="w-full space-y-4">
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center space-y-2">
            <p className="text-destructive font-semibold text-lg">Acesso Negado</p>
            <p className="text-destructive/80 text-sm">
              Você precisa estar logado como cliente para acessar esta área.
            </p>
          </div>

          <Button
            onClick={() => navigate('/painel-cliente/login')}
            variant="default"
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
          >
            Fazer Login
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </AuthContainer>
    );
  }

  // Se não é cliente, mostrar acesso negado
  if (!isClient) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Acesso Negado">
        <div className="w-full space-y-4">
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center space-y-2">
            <p className="text-destructive font-semibold text-lg">Acesso Negado</p>
            <p className="text-destructive/80 text-sm">
              Esta área é exclusiva para clientes.
            </p>
          </div>

          <Button
            onClick={() => navigate('/painel-cliente/login')}
            variant="outline"
            className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Fazer Login como Cliente
          </Button>
        </div>
      </AuthContainer>
    );
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
};

export default ClientRoute;
