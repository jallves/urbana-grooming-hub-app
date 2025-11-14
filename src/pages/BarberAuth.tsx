
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Scissors } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

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

  // Show access denied message if user is logged in but doesn't have access
  if (!authLoading && user && !isAdmin && !isBarber) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Acesso Negado">
        <div className="w-full space-y-6">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600 font-medium">Você não tem acesso ao painel do barbeiro.</p>
          </div>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
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
