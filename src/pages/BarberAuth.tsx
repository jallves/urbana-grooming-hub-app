
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';

const BarberAuth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const { user, isBarber, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Timer countdown effect
  useEffect(() => {
    if (!authLoading && !user && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (!authLoading && !user && timeLeft === 0) {
      navigate('/');
    }
  }, [timeLeft, user, authLoading, navigate]);

  // Reset timer when user changes
  useEffect(() => {
    if (!authLoading && !user) {
      setTimeLeft(10);
    }
  }, [user, authLoading]);

  // Redirect authenticated users with proper access
  useEffect(() => {
    if (!authLoading && user && (isAdmin || isBarber)) {
      console.log('✅ User has access - redirecting to dashboard');
      navigate('/barbeiro');
    }
  }, [user, authLoading, isBarber, isAdmin, navigate]);

  const handleLoginSuccess = async (userId: string) => {
    navigate('/barbeiro');
  };

  // Show loading while checking auth
  if (authLoading) {
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  // Show access denied message if user is logged in but doesn't have access
  if (!authLoading && user && !isAdmin && !isBarber) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400">Acesso Negado</h1>
            <div className="mt-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm font-medium mb-2">
                ❌ Você não tem permissão para acessar esta área
              </p>
              <p className="text-red-300 text-xs mb-2">
                <strong>Apenas barbeiros cadastrados pelo administrador</strong> podem acessar este painel.
              </p>
              <p className="text-red-300 text-xs mb-2">
                Email detectado: <strong>{user.email}</strong>
              </p>
              <p className="text-red-300 text-xs">
                Se você é barbeiro, entre em contato com o administrador para ser cadastrado no sistema.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Costa Urbana</h1>
          <p className="mt-2 text-gray-400">
            Acesso para barbeiros cadastrados
          </p>
          {!user && timeLeft > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Redirecionando para a página inicial em {timeLeft} segundos
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-yellow-300 hover:text-yellow-100 underline text-sm"
              >
                Clique aqui para ir agora
              </button>
            </div>
          )}
        </div>
        
        {!user && (
          <div className="bg-zinc-900 shadow-lg rounded-lg p-6 border border-zinc-800">
            <BarberLoginForm 
              loading={loading}
              setLoading={setLoading}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberAuth;
