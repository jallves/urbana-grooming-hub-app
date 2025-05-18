
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BarberLoginForm from '@/components/barber/auth/BarberLoginForm';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useBarberRoleCheck } from '@/hooks/useBarberRoleCheck';

const BarberAuth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { user, loading: authLoading } = useAuth();
  const { checkingRole, setCheckingRole, checkBarberRole } = useBarberRoleCheck();

  // Check if user is already authenticated and has barber role
  useEffect(() => {
    if (!authLoading && user) {
      console.log('BarberAuth - User already authenticated, checking roles');
      setCheckingRole(true);
      checkBarberRole(user.id);
    }
  }, [user, authLoading, setCheckingRole, checkBarberRole]);

  if (authLoading || checkingRole) {
    return (
      <AuthLoadingScreen 
        message={checkingRole ? 'Verificando permissões...' : 'Carregando...'}
      />
    );
  }

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
            onLoginSuccess={checkBarberRole}
          />
        </div>
      </div>
    </div>
  );
};

export default BarberAuth;
