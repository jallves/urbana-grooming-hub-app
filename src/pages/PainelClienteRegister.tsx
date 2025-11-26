
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

const PainelClienteRegister: React.FC = () => {
  const { cliente, authLoading } = usePainelClienteAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (cliente) {
    // Se já está autenticado, redireciona para o dashboard
    return <Navigate to="/painel-cliente/dashboard" replace />;
  }

  // Se não estiver autenticado, redireciona para o login
  return <Navigate to="/painel-cliente/login" replace />;
};

export default PainelClienteRegister;
