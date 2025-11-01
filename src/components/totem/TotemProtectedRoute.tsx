import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { LoaderPage } from '@/components/ui/loader-page';

interface TotemProtectedRouteProps {
  children: React.ReactNode;
}

const TotemProtectedRoute: React.FC<TotemProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useTotemAuth();

  if (loading) {
    return <LoaderPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/totem/login" replace />;
  }

  return <>{children}</>;
};

export default TotemProtectedRoute;
