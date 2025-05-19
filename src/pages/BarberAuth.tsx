
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useNavigate } from 'react-router-dom';

const BarberAuth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isBarber, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated and has barber role
  useEffect(() => {
    if (!authLoading && user) {
      if (isBarber) {
        console.log('BarberAuth - User already authenticated as barber, redirecting to dashboard');
        navigate('/barbeiro/dashboard');
      }
    }
  }, [user, authLoading, isBarber, navigate]);

  if (authLoading) {
    return <AuthLoadingScreen message="Verificando credenciais..." />;
  }

  const handleLoginSuccess = async (userId: string) => {
    // After successful login, simply redirect to dashboard
    // AuthContext will handle the role check
    navigate('/barbeiro/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Urbana Barbearia</h1>
          <p className="mt-2 text-gray-400">
            Acesso exclusivo para barbeiros
          </p>
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
