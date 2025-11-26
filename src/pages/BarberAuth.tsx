
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
  const { user, isBarber, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users with proper access
  useEffect(() => {
    if (!authLoading && user && (isAdmin || isBarber)) {
      console.log('✅ User has access - redirecting to dashboard');
      navigate('/barbeiro', { replace: true });
    }
  }, [user, authLoading, isBarber, isAdmin, navigate]);

  const handleLoginSuccess = async (userId: string) => {
    console.log('Login successful for user:', userId);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Show loading while checking auth
  if (authLoading) {
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      console.log('[BarberAuth] 🚪 Logout realizado com sucesso');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[BarberAuth] ❌ Erro ao fazer logout:', error);
    }
  };

  // Show access denied message if user is logged in but doesn't have access
  if (!authLoading && user && !isAdmin && !isBarber) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Acesso Negado">
        <div className="w-full space-y-4">
          {/* User info */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">Logado como:</p>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>

          {/* Error message */}
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center space-y-2">
            <Scissors className="h-12 w-12 mx-auto text-destructive/70" />
            <p className="text-destructive font-semibold text-lg">Acesso Negado</p>
            <p className="text-destructive/80 text-sm">
              Você não tem permissão para acessar o painel do barbeiro.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="default"
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl transition-all"
            >
              Fazer Logout
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao site
            </Button>
          </div>
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
