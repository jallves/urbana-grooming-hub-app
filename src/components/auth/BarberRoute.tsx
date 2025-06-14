
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
    console.log('BarberRoute: loading...');
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('BarberRoute - User not authenticated, redirecting to login');
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Only run the access logic ONCE per user status change:
  // Allow access if user is admin OR has barber role
  const hasAccess = isAdmin || isBarber;

  if (!hasAccess) {
    // Para evitar loop infinito de toast + redirect:
    if (location.pathname !== '/barbeiro/login') {
      console.log('BarberRoute - Access DENIED. User:', {
        email: user.email,
        isAdmin,
        isBarber
      });
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar esta área. Verifique se você possui o papel de barbeiro.',
        variant: 'destructive',
      });
    }
    // Redirecionamento único
    return <Navigate to="/barbeiro/login" replace />;
  }

  console.log('BarberRoute - Access GRANTED for:', {
    email: user.email,
    isAdmin,
    isBarber
  });

  return <>{children}</>;
};

export default BarberRoute;

