import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthContainer from '@/components/ui/containers/AuthContainer';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
  allowedRoles?: string[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = false,
  requiredModule,
}) => {
  const { user, isAdmin, isBarber, isManager, isMaster, canAccessModule, loading, requiresPasswordChange, signOut, rolesChecked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTimeoutOptions, setShowTimeoutOptions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Persistência de rota: salvar rota atual quando mudar (somente se autenticado)
  useEffect(() => {
    if (!loading && rolesChecked && user) {
      localStorage.setItem('admin_last_route', location.pathname);
    }
  }, [location.pathname, loading, rolesChecked, user]);

  // Usuário tem acesso se for admin, manager, master ou (barber quando permitido)
  const hasAccess = user ? (isAdmin || isManager || isMaster || (allowBarber && isBarber)) : false;
  
  // Validação simplificada de módulo usando a função do AuthContext
  const hasModuleAccess = requiredModule ? canAccessModule(requiredModule) : true;

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
            onClick={() => {
              console.log('[AdminRoute] 🚪 Logout COMPLETO iniciado...');
              
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
              
              // 4. Forçar reload completo para garantir que tudo foi limpo (vai para /auth)
              console.log('[AdminRoute] ✅ Limpeza completa realizada, forçando reload...');
              window.location.href = '/auth';
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

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirecionar para troca de senha se necessário (exceto se já estiver na página de troca)
  if (requiresPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!hasAccess || (requiredModule && !hasModuleAccess)) {
    console.error('[AdminRoute] 🚫 Acesso negado:', {
      hasAccess,
      hasModuleAccess,
      requiredModule,
      isAdmin,
      isMaster,
      userEmail: user?.email
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-6 max-w-lg bg-card p-8 rounded-lg shadow-lg border border-border">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground font-playfair">🔒 Acesso Restrito</h2>
            <p className="text-muted-foreground font-raleway">
              {requiredModule && !hasModuleAccess
                ? 'Você não tem permissão para acessar este módulo.'
                : 'Você não tem permissão para acessar esta área.'}
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md text-left space-y-2">
            <p className="text-sm text-muted-foreground font-raleway">
              <strong className="text-foreground">Usuário:</strong> {user?.email}
            </p>
            <p className="text-xs text-muted-foreground font-raleway mt-4 italic">
              💡 Se suas permissões foram atualizadas recentemente, faça logout e login novamente para que as mudanças tenham efeito.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button 
              onClick={() => {
                signOut(); // Não precisa await - é instantâneo
              }}
              className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 font-raleway font-medium"
            >
              Fazer Logout
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              variant="outline"
              className="border-border font-raleway"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo com transição suave
  return <div className="animate-fade-in">{children}</div>;
};

export default AdminRoute;
