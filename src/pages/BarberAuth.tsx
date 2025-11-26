
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Scissors } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import { supabase } from '@/integrations/supabase/client';

const BarberAuth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isBarber, isAdmin, isMaster, isManager, loading: authLoading, rolesChecked, signOut } = useAuth();
  const navigate = useNavigate();

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
    const hasBarberAccess = isBarber || isAdmin || isMaster || isManager;
    if (hasBarberAccess) {
      console.log('[BarberAuth] ✅ Barbeiro autenticado - redirecionando para dashboard');
      navigate('/barbeiro/dashboard', { replace: true });
    } else {
      console.log('[BarberAuth] ℹ️ Usuário não é barbeiro - redirecionando para home');
      navigate('/', { replace: true });
    }
  }, [user, isBarber, isAdmin, isMaster, isManager, rolesChecked, authLoading, navigate]);

  const handleLoginSuccess = async (userId: string) => {
    console.log('Login successful for user:', userId);
    // Após login bem-sucedido, redirecionar para dashboard
    navigate('/barbeiro/dashboard', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Aguardar verificação de roles
  if (authLoading || !rolesChecked) {
    return <AuthLoadingScreen message="Verificando autenticação..." />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('[BarberAuth] 🚪 Logout realizado com sucesso');
    } catch (error) {
      console.error('[BarberAuth] ❌ Erro ao fazer logout:', error);
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
      subtitle="Acesso Barbeiro"
    >
      <BarberLoginForm 
        onLoginSuccess={handleLoginSuccess}
        loading={loading}
        setLoading={setLoading}
      />

      <Button
        variant="outline"
        className="w-full mt-6 border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
        onClick={handleGoHome}
      >
        <Home className="h-4 w-4 mr-2" />
        Voltar ao site
      </Button>
    </AuthContainer>
  );
};

export default BarberAuth;
