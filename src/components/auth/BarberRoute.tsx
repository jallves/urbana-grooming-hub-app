import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthContainer from '@/components/ui/containers/AuthContainer';

interface BarberRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ 
  children, 
  allowBarber = true, 
  requiredModule 
}) => {
  const { user, loading, rolesChecked, isAdmin, isBarber, isMaster, isManager, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showTimeoutOptions, setShowTimeoutOptions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // CRÍTICO: Persistência de rota - salvar SEMPRE a rota atual quando autenticado
  useEffect(() => {
    if (!loading && rolesChecked && user) {
      const hasAccess = isMaster || isAdmin || isManager || (allowBarber && isBarber);
      if (hasAccess && location.pathname.startsWith('/barbeiro/')) {
        // Salva a rota atual para persistir após reload
        console.log('[BarberRoute] 💾 Salvando rota:', location.pathname);
        localStorage.setItem('barber_last_route', location.pathname);
      }
    }
  }, [location.pathname, loading, rolesChecked, user, isMaster, isAdmin, isManager, isBarber, allowBarber]);

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
              localStorage.removeItem('barber_last_route');
              await signOut();
              navigate('/barbeiro/login');
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
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mb-4"></div>
        <p className="text-urbana-light/80 text-lg font-medium animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Check access permissions (admin, master, manager ou barber se permitido)
  const hasAccess = isMaster || isAdmin || isManager || (allowBarber && isBarber);

  if (!hasAccess) {
    console.log('[BarberRoute] ❌ Acesso NEGADO');
    console.log('[BarberRoute] Usuário:', user.email);
    console.log('[BarberRoute] isMaster:', isMaster);
    console.log('[BarberRoute] isAdmin:', isAdmin);
    console.log('[BarberRoute] isManager:', isManager);
    console.log('[BarberRoute] isBarber:', isBarber);
    console.log('[BarberRoute] allowBarber:', allowBarber);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem acesso ao painel do barbeiro.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Este painel é exclusivo para profissionais cadastrados. Entre em contato com o administrador.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={async () => {
                localStorage.clear();
                await signOut();
                navigate('/barbeiro/login', { replace: true });
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="default"
              className="w-full sm:w-auto"
            >
              Voltar ao site
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo com transição suave para evitar flash
  return <div className="animate-fade-in">{children}</div>;
};
export default BarberRoute;
