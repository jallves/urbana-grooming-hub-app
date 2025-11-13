import React from 'react';
import { Navigate } from 'react-router-dom';

const InstallCliente: React.FC = () => {
  return <Navigate to="/install/painel-cliente" replace />;
};

export default InstallCliente;
