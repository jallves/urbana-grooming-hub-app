import React from 'react';
import { Navigate } from 'react-router-dom';

const InstallTotem: React.FC = () => {
  return <Navigate to="/install/totem" replace />;
};

export default InstallTotem;
