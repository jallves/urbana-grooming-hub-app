import React from 'react';
import { Navigate } from 'react-router-dom';

const InstallBarbeiro: React.FC = () => {
  return <Navigate to="/install/barbeiro" replace />;
};

export default InstallBarbeiro;
