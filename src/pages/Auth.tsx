
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
  const { user, isAdmin, loading: authLoading, rolesChecked } = useAuth();

  // Redireciona admin para o painel (SEM redirecionar para home)
  useEffect(() => {
    console.log('[Auth.tsx] Estado atual:', { 
      authLoading, 
      user: user?.email, 
      isAdmin,
      hasUser: !!user,
      rolesChecked,
      redirectAttempted 
    });
    
    // Prevenir múltiplas tentativas de redirecionamento
    if (redirectAttempted) {
      console.log('[Auth.tsx] ⚠️ Redirecionamento já tentado, ignorando...');
      return;
    }
    
    // CRÍTICO: Só redirecionar quando:
    // 1. authLoading é false (verificação completa)
    // 2. rolesChecked é true (roles foram verificadas)
    // 3. user existe
    // 4. É admin
    // 5. Ainda não tentou redirecionar
    if (!authLoading && rolesChecked && user && user.email && isAdmin) {
      console.log('[Auth.tsx] ✅ Admin detectado, redirecionando para /admin');
      setRedirectAttempted(true);
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, authLoading, rolesChecked, redirectAttempted]);

  // Reset redirectAttempted quando o usuário muda
  useEffect(() => {
    setRedirectAttempted(false);
  }, [user?.id]);

  // Credenciais de admin removidas por segurança
  // Use o Supabase Dashboard para criar usuários admin manualmente

  if (authLoading) {
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

  // Show access denied if user is logged in but not admin
  if (!authLoading && user && rolesChecked && !isAdmin) {
    return (
      <AuthContainer 
        title="Costa Urbana"
        subtitle="Acesso Negado"
      >
        <div className="w-full space-y-6">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600 font-medium">Você não tem acesso ao painel administrador.</p>
          </div>

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
