import React from 'react';
import { Navigate } from 'react-router-dom';

const InstallAdmin: React.FC = () => {
  return <Navigate to="/install/admin" replace />;
};

export default InstallAdmin;
