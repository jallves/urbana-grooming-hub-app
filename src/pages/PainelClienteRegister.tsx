
import React from 'react';
import { Navigate } from 'react-router-dom';

const PainelClienteRegister: React.FC = () => {
  // For now, redirect to the existing register page
  return <Navigate to="/painel-cliente/register" replace />;
};

export default PainelClienteRegister;
