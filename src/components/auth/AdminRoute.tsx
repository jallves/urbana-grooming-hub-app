
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = false, 
  requiredModule 
}) => {
  const { user, isAdmin, isBarber, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Always call all hooks first - this must happen on every render
  useEffect(() => {
    // Only show toast messages when we have a clear access denial
    if (!loading) {
      if (!user) {
        console.log('AdminRoute: Redirecting to /auth (not authenticated)');
        toast({
          title: 'Acesso Restrito',
          description: 'Você precisa estar logado para acessar esta página',
          variant: 'destructive',
        });
      } else if (!isAdmin && !(allowBarber && isBarber)) {
        console.log(`AdminRoute: Access denied, redirecting user to appropriate page`);
        toast({
          title: 'Acesso Restrito',
          description: 'Você não tem permissão para acessar o painel administrativo',
          variant: 'destructive',
        });
      }
    }
  }, [loading, user, isAdmin, isBarber, allowBarber, toast]);
  
  // If still loading, show spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    console.log('AdminRoute: Redirecting to /auth (not authenticated)');
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  // Admin always has access
  if (isAdmin) {
    console.log('AdminRoute: Allowing access for admin');
    return <>{children}</>;
  }

  // If barbers are allowed and user is a barber
  if (allowBarber && isBarber) {
    console.log('AdminRoute: Allowing access for barber');
    return <>{children}</>;
  }
  
  // Default: No access, redirect to appropriate location
  console.log(`AdminRoute: Access denied, redirecting user to appropriate page`);
  return <Navigate to="/" replace />;
};

export default AdminRoute;
