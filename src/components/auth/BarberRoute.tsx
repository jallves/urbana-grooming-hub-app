
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

interface BarberRouteProps {
  children: React.ReactNode;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ children }) => {
  const { user, loading, isAdmin, isBarber } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Show loading screen while checking authentication
  if (loading) {
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('BarberRoute - User not authenticated, redirecting to login');
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Check if has access (admin, barber, or special user)
  const hasAccess = isAdmin || isBarber;
  
  if (!hasAccess) {
    console.log('BarberRoute - User does not have barber permission, redirecting to home');
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta área',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role, render the protected content
  console.log('BarberRoute - Access allowed for barber route');
  return <>{children}</>;
};

export default BarberRoute;
