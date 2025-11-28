import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home } from 'lucide-react';
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

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
      <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen min-h-[100dvh] w-full px-4 sm:px-6 text-center bg-gradient-to-br from-urbana-black via-urbana-black/95 to-urbana-black/90 safe-top safe-bottom">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          <div className="p-5 sm:p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center space-y-2">
            <p className="text-yellow-500 font-semibold text-base sm:text-lg leading-relaxed">⏱️ Demorando Muito?</p>
            <p className="text-urbana-light/80 text-xs sm:text-sm leading-relaxed">
              A verificação está demorando mais que o esperado.
            </p>
          </div>

          <Button
            onClick={() => {
              console.log('[BarberRoute] 🚪 Logout COMPLETO iniciado...');
              
              // Mostrar tela de loading
              setShowLoadingScreen(true);
              
              // Aguardar um momento para o usuário ver a tela de loading
              setTimeout(() => {
                // 1. Limpar TODAS as sessões e caches locais IMEDIATAMENTE (igual ao menu hambúrguer)
                localStorage.removeItem('admin_last_route');
                localStorage.removeItem('barber_last_route');
                localStorage.removeItem('client_last_route');
                localStorage.removeItem('totem_last_route');
                localStorage.removeItem('user_role_cache');
                localStorage.removeItem('barber_session_token');
                localStorage.removeItem('client_session_token');
                
                // 2. Limpar qualquer cache do Supabase
                const supabaseKeys = Object.keys(localStorage).filter(key => 
                  key.startsWith('sb-') || key.includes('supabase')
                );
                supabaseKeys.forEach(key => localStorage.removeItem(key));
                
                // 3. Chamar o signOut do contexto
                signOut();
                
                // 4. Forçar reload completo para garantir que tudo foi limpo (vai para /barbeiro/login)
                console.log('[BarberRoute] ✅ Limpeza completa realizada, forçando reload...');
                window.location.href = '/barbeiro/login';
              }, 100);
            }}
            variant="default"
            disabled={isLoggingOut}
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair e Fazer Login Novamente
          </Button>
        </div>
      </div>
    );
  }

  // CRÍTICO: Durante loading inicial (primeiros 3 segundos), mostrar loading bonito
  if (loading || !rolesChecked || showLoadingScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen min-h-[100dvh] w-full px-4 sm:px-6 text-center bg-gradient-to-br from-urbana-black via-urbana-black/95 to-urbana-black/90 safe-top safe-bottom">
        <div className="relative mb-6 sm:mb-8">
          {/* Círculo animado externo */}
          <div className="absolute inset-0 rounded-full border-3 sm:border-4 border-urbana-gold/20 animate-ping"></div>
          {/* Círculo animado interno */}
          <div className="relative animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-3 border-b-3 sm:border-t-4 sm:border-b-4 border-urbana-gold"></div>
        </div>
        
        {/* Barra de progresso animada */}
        <div className="w-56 sm:w-64 max-w-[90vw] h-1.5 sm:h-2 bg-urbana-black/50 rounded-full overflow-hidden mb-5 sm:mb-6">
          <div className="h-full bg-gradient-to-r from-urbana-gold via-yellow-500 to-urbana-gold animate-[slide_1.5s_ease-in-out_infinite] w-1/2"></div>
        </div>
        
        <p className="text-urbana-gold text-lg sm:text-xl font-semibold animate-pulse mb-2 leading-relaxed">
          Carregando Painel
        </p>
        <p className="text-urbana-light/60 text-sm leading-relaxed px-4">
          Verificando suas credenciais...
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
