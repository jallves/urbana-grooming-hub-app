import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoaderPage } from '@/components/ui/loader-page';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import { supabase } from '@/integrations/supabase/client';

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
            onClick={async () => {
              setIsLoggingOut(true);
              console.log('[ClientRoute] 🚪 Iniciando logout COMPLETO...');
              
              // 1. Limpar TUDO do localStorage e sessionStorage primeiro
              localStorage.clear();
              sessionStorage.clear();
              console.log('[ClientRoute] 🧹 Storage limpo');
              
              // 2. Limpar estado do AuthContext
              signOut();
              console.log('[ClientRoute] 🧹 Estado do AuthContext limpo');
              
              // 3. Garantir que o Supabase também deslogou
              try {
                await supabase.auth.signOut();
                console.log('[ClientRoute] ✅ Supabase deslogado');
              } catch (error) {
                console.warn('[ClientRoute] ⚠️ Erro ao deslogar do Supabase:', error);
              }
              
              // 4. Aguardar um pouco para garantir que tudo foi limpo
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // 5. FORÇAR reload completo da página para limpar TUDO do React
              console.log('[ClientRoute] 🔄 Forçando reload completo...');
              window.location.href = '/painel-cliente/login';
            }}
            variant="default"
            disabled={isLoggingOut}
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair e Fazer Login Novamente
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

  // CRÍTICO: Durante loading inicial (primeiros 3 segundos), mostrar loading bonito
  if (loading || !rolesChecked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gradient-to-br from-urbana-black via-urbana-black/95 to-urbana-black/90">
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
