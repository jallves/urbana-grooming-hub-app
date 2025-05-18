
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean; // Prop to specify if barbers are allowed
  requiredModule?: string; // Prop to specify required module
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = false, // Default to false to restrict barber access
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
      path: location.pathname,
      userEmail: user?.email
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
  
  // Special case for specific emails
  if (user.email === 'joao.colimoides@gmail.com') {
    console.log('AdminRoute: Allowing access for special admin user');
    return <>{children}</>;
  }

  // Special case for our barber user
  if (user.email === 'jhoaoallves84@gmail.com') {
    console.log('AdminRoute: Special barber user detected');
    if (allowBarber || location.pathname.includes('/admin/barbeiros')) {
      console.log('AdminRoute: Allowing access for special barber user to:', location.pathname);
      return <>{children}</>;
    }
  }
  
  // Admin always has access
  if (isAdmin) {
    console.log('AdminRoute: Allowing access for admin');
    return <>{children}</>;
  }

  // Define allowed paths for barbers
  const allowedBarberPaths = [
    '/admin', // Dashboard
    '/admin/agendamentos', // Appointments
    '/admin/clientes', // Clients
    '/admin/barbeiros' // Barbers
  ];
  
  // For barbers, check if current path is in allowed paths
  if (isBarber && (allowBarber || location.pathname.includes('/admin/barbeiros'))) {
    // Check if current path is in allowed paths
    const currentPath = location.pathname;
    const hasAccess = allowedBarberPaths.some(path => currentPath.startsWith(path));
    
    if (hasAccess) {
      console.log('AdminRoute: Allowing access for barber to specific admin page:', currentPath);
      return <>{children}</>;
    } else {
      console.log('AdminRoute: Path not allowed for barber:', currentPath);
      toast({
        title: 'Acesso Restrito',
        description: 'Você não tem permissão para acessar esta seção do painel administrativo',
        variant: 'destructive',
      });
      return <Navigate to="/admin" replace />;
    }
  }
  
  // Default: No access, redirect to appropriate location
  console.log(`AdminRoute: Access denied, redirecting user to appropriate page`);
  toast({
    title: 'Acesso Restrito',
    description: 'Você não tem permissão para acessar o painel administrativo',
    variant: 'destructive',
  });
  
  // Redirect regular users to home
  return <Navigate to="/" replace />;
};

export default AdminRoute;
