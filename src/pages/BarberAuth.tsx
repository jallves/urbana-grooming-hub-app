
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';

const BarberAuth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const { user, isBarber, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Timer countdown effect
  useEffect(() => {
    if (!authLoading && !user && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (!authLoading && !user && timeLeft === 0) {
      // Redirect to homepage when timer reaches 0
      navigate('/');
    }
  }, [timeLeft, user, authLoading, navigate]);

  // Reset timer when user changes
  useEffect(() => {
    if (!authLoading && !user) {
      setTimeLeft(10);
    }
  }, [user, authLoading]);

  // Redirect if already authenticated and has barber role AND is active staff
  useEffect(() => {
    if (!authLoading && user) {
      if (isBarber) {
        console.log('BarberAuth - User already authenticated as active barber, redirecting to dashboard');
        navigate('/barbeiro');
      }
    }
  }, [user, authLoading, isBarber, navigate]);

  const handleLoginSuccess = async (userId: string) => {
    // After successful login, simply redirect to dashboard
    // AuthContext will handle the role and staff verification
    navigate('/barbeiro');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Urbana Barbearia</h1>
          <p className="mt-2 text-gray-400">
            Acesso exclusivo para barbeiros cadastrados
          </p>
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded-lg">
            <p className="text-blue-400 text-sm font-medium">
              ⚠️ Apenas barbeiros cadastrados no sistema podem acessar
            </p>
            <p className="text-blue-300 text-xs mt-1">
              Se você é barbeiro e não consegue acessar, entre em contato com o administrador
            </p>
          </div>
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
        
        <div className="bg-zinc-900 shadow-lg rounded-lg p-6 border border-zinc-800">
          <BarberLoginForm 
            loading={loading}
            setLoading={setLoading}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default BarberAuth;
