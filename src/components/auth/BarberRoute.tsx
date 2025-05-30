
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

  // Allow access if user is admin OR has barber role
  const hasAccess = isAdmin || isBarber;
  
  if (!hasAccess) {
    console.log('BarberRoute - Access DENIED. User is not admin or barber:', {
      email: user.email,
      isAdmin,
      isBarber
    });
    
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta área.',
      variant: 'destructive',
    });
    
    // Redirect to login instead of forcing logout
    return <Navigate to="/barbeiro/login" replace />;
  }

  // If authenticated and has proper access, render the protected content
  console.log('BarberRoute - Access GRANTED for:', {
    email: user.email,
    isAdmin,
    isBarber
  });
  
  return <>{children}</>;
};

export default BarberRoute;
