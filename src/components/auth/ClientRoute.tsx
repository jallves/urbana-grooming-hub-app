import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoaderPage } from '@/components/ui/loader-page';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

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
      <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen w-full px-4 text-center bg-gradient-to-br from-urbana-black via-urbana-black/95 to-urbana-black/90">
        <div className="w-full max-w-md space-y-6">
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center space-y-2">
            <p className="text-yellow-500 font-semibold text-lg">⏱️ Demorando Muito?</p>
            <p className="text-urbana-light/80 text-sm">
              A verificação está demorando mais que o esperado.
            </p>
          </div>

          <Button
            onClick={() => {
              console.log('[ClientRoute] 🚪 Logout COMPLETO iniciado...');
              
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
                
                // 4. Forçar reload completo para garantir que tudo foi limpo (vai para /painel-cliente/login)
                console.log('[ClientRoute] ✅ Limpeza completa realizada, forçando reload...');
                window.location.href = '/painel-cliente/login';
              }, 100);
            }}
            variant="default"
            disabled={isLoggingOut}
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
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
      <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen w-full px-4 text-center bg-gradient-to-br from-urbana-black via-urbana-black/95 to-urbana-black/90">
        <div className="relative mb-8">
          {/* Círculo animado externo */}
          <div className="absolute inset-0 rounded-full border-4 border-urbana-gold/20 animate-ping"></div>
          {/* Círculo animado interno */}
          <div className="relative animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-urbana-gold"></div>
        </div>
        
        {/* Barra de progresso animada */}
        <div className="w-64 h-2 bg-urbana-black/50 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-urbana-gold via-yellow-500 to-urbana-gold animate-[slide_1.5s_ease-in-out_infinite] w-1/2"></div>
        </div>
        
        <p className="text-urbana-gold text-xl font-semibold animate-pulse mb-2">
          Carregando Painel
        </p>
        <p className="text-urbana-light/60 text-sm">
          Verificando suas credenciais...
        </p>
      </div>
    );
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
