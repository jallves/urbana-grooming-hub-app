
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean; // New prop to specify if barbers are allowed
  requiredModule?: string; // New prop to specify required module
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = true, // Alterado para true por padrão
  requiredModule
}) => {
  const { user, isAdmin, isBarber, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Debug logging
  useEffect(() => {
    console.log('AdminRoute: Access state', { 
      isLoading: loading, 
      isAuthenticated: !!user, 
      isAdmin,
      isBarber,
      allowBarber,
      requiredModule,
      path: location.pathname
    });
  }, [loading, user, isAdmin, isBarber, allowBarber, requiredModule, location.pathname]);
  
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
    toast({
      title: 'Acesso Restrito',
      description: 'Você precisa estar logado para acessar esta página',
      variant: 'destructive',
    });
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  // Special case for specific email
  if (user.email === 'joao.colimoides@gmail.com') {
    console.log('AdminRoute: Allowing access for special user');
    return <>{children}</>;
  }
  
  // Admin always has access
  if (isAdmin) {
    console.log('AdminRoute: Allowing access for admin');
    return <>{children}</>;
  }
  
  // Barber with allowed access to admin panel
  if (isBarber && allowBarber) {
    // Todos os barbeiros têm permissão para acessar o painel admin
    console.log('AdminRoute: Allowing access for barber');
    return <>{children}</>;
  }
  
  // Default: No access, redirect to appropriate location
  console.log(`AdminRoute: Access denied, redirecting ${isBarber ? 'barber' : 'user'} to appropriate page`);
  toast({
    title: 'Acesso Restrito',
    description: 'Você não tem permissão para acessar o painel administrativo',
    variant: 'destructive',
  });
  
  // Redirect barbers to barber dashboard, regular users to home
  return <Navigate to={isBarber ? "/barbeiro/dashboard" : "/"} replace />;
};

export default AdminRoute;
