
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Redireciona admin para o painel, outros para home
  useEffect(() => {
    console.log('[Auth.tsx] Estado atual:', { 
      authLoading, 
      user: user?.email, 
      isAdmin,
      hasUser: !!user 
    });
    
    // IMPORTANTE: Só redireciona se não estiver em processo de loading
    // E se realmente houver um usuário autenticado
    if (!authLoading && user && user.email) {
      console.log('[Auth.tsx] 🔄 Usuário autenticado, verificando redirecionamento...');
      
      // Pequeno delay para garantir que o estado de roles foi atualizado
      const timer = setTimeout(() => {
        if (isAdmin) {
          console.log('[Auth.tsx] ✅ Admin detectado, redirecionando para /admin');
          navigate('/admin', { replace: true });
        } else if (!location.state?.from) {
          console.log('[Auth.tsx] ℹ️ Não é admin, redirecionando para home');
          navigate('/', { replace: true });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, navigate, authLoading, location.state]);

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

  return (
    <AuthContainer 
      title="Costa Urbana"
      subtitle="Painel Administrativo"
    >
      <div className="w-full space-y-6">
        <LoginForm loading={loading} setLoading={setLoading} />

        <Button
          variant="outline"
          className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-urbana-gold h-12 rounded-xl transition-all"
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
