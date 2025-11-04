
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Scissors, Shield } from 'lucide-react';
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
      <AuthContainer className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-400" />
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-red-400 mb-2">Acesso Negado</h1>
                <p className="text-zinc-400 text-sm">
                  Você não tem permissão para acessar esta área
                </p>
              </div>

              {/* Error details */}
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <p className="text-red-300">
                    <strong>Apenas barbeiros cadastrados</strong> podem acessar este painel.
                  </p>
                  <p className="text-red-400">
                    Email: <span className="font-mono">{user.email}</span>
                  </p>
                  <p className="text-red-300">
                    Entre em contato com o administrador para ser cadastrado no sistema.
                  </p>
                </div>
              </div>

              {/* Action button */}
              <Button
                onClick={handleGoHome}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar para Home
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
        className="w-full mt-6 border-gray-700 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
        onClick={handleGoHome}
      >
        <Home className="h-4 w-4 mr-2" />
        Voltar ao site
      </Button>
    </AuthContainer>
  );
};

export default BarberAuth;
