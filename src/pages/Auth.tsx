
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Scissors } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, isManager, isMaster, loading: authLoading, rolesChecked, signOut } = useAuth();

  // Verifica se o usuário tem acesso administrativo (admin, manager ou master)
  const hasAdminAccess = isAdmin || isManager || isMaster;

  // FORÇAR LOGOUT se usuário tentar acessar a página de login
  useEffect(() => {
    const forceLogoutOnLoginPage = async () => {
      if (!authLoading && user) {
        console.log('[Auth] 🚪 Usuário tentando acessar login - forçando logout da sessão anterior');
        await signOut();
      }
    };
    
    forceLogoutOnLoginPage();
  }, []); // Executa apenas uma vez ao montar

  // Credenciais de admin removidas por segurança
  // Use o Supabase Dashboard para criar usuários admin manualmente

  if (authLoading && !rolesChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Preparando login...</p>
        </div>
      </div>
    );
  }

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('[Auth] 🚪 Logout realizado');
    } catch (error) {
      console.error('[Auth] ❌ Erro ao fazer logout:', error);
    }
  };

  // Se ainda há usuário após o force logout, mostrar botão de logout manual
  if (user) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Sessão Ativa">
        <div className="w-full space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">Sessão detectada:</p>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>

          <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center space-y-2">
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
              Você precisa fazer logout para acessar o login
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="default"
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
          >
            Fazer Logout
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full h-12 rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer 
      title="Costa Urbana"
      subtitle="Painel Administrativo"
    >
      <div className="w-full space-y-6">
        <LoginForm loading={loading} setLoading={setLoading} />

        <Button
          variant="outline"
          className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
          onClick={handleGoHome}
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao site
        </Button>
      </div>
    </AuthContainer>
  );
};

export default Auth;
