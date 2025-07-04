
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

const PainelClienteRegister: React.FC = () => {
  const { cliente } = usePainelClienteAuth();

  if (cliente) {
    // Se já está autenticado, redireciona para o dashboard
    return <Navigate to="/painel-cliente/dashboard" replace />;
  }

  // Se não estiver autenticado, redireciona para o cadastro
  return (
    <>
      <p className="text-center text-gray-400">Redirecionando para a página de cadastro...</p>
      <Navigate to="/painel-cliente/register" replace />
    </>
  );
};

export default PainelClienteRegister;

