
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

  // REDIRECIONAR usuário já logado para seu painel apropriado
  useEffect(() => {
    // Aguardar verificação completa de roles
    if (authLoading || !rolesChecked) {
      return;
    }

    // Sem usuário = mostrar formulário de login
    if (!user) {
      return;
    }

    // Usuário autenticado - redirecionar para seu painel
    if (hasAdminAccess) {
      console.log('[Auth] ✅ Admin autenticado - redirecionando para dashboard admin');
      navigate('/admin', { replace: true });
    } else {
      console.log('[Auth] ℹ️ Usuário não é admin - redirecionando para home');
      navigate('/', { replace: true });
    }
  }, [user, hasAdminAccess, rolesChecked, authLoading, navigate]);

  // Credenciais de admin removidas por segurança
  // Use o Supabase Dashboard para criar usuários admin manualmente

  // Aguardar verificação de roles antes de mostrar loading
  if (authLoading || !rolesChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
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

  // Não deve chegar aqui com usuário logado (redirecionamento acima cuida disso)
  // Mas mantemos como fallback de segurança
  if (user) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Redirecionando...">
        <div className="w-full space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Redirecionando...</p>
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
