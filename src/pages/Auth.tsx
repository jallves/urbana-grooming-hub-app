
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
      console.log('[Auth] ✅ Admin autenticado - redirecionando');
      
      // CRÍTICO: Verificar se há uma rota salva para restaurar
      const savedRoute = localStorage.getItem('admin_last_route');
      const targetRoute = savedRoute && savedRoute.startsWith('/admin') 
        ? savedRoute 
        : '/admin';
      
      console.log('[Auth] 🎯 Redirecionando para:', targetRoute);
      navigate(targetRoute, { replace: true });
    } else {
      console.log('[Auth] ℹ️ Usuário não é admin - redirecionando para home');
      navigate('/', { replace: true });
    }
  }, [user, hasAdminAccess, rolesChecked, authLoading, navigate]);

  // Credenciais de admin removidas por segurança
  // Use o Supabase Dashboard para criar usuários admin manualmente

  // Não mostrar loading - ir direto para formulário
  // O redirecionamento é feito pelo useEffect quando houver usuário autenticado

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    console.log('[Auth] 🚪 Logout - limpando rota salva');
    localStorage.removeItem('admin_last_route'); // Limpa a rota salva ao fazer logout
    signOut();
  };

  // Se usuário logado, useEffect cuida do redirecionamento
  // Sempre mostrar formulário imediatamente

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
