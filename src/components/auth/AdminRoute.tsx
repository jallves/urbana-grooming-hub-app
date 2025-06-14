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
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (location.pathname !== '/auth') {
          console.log('AdminRoute: User not authenticated');
          toast({
            title: 'Acesso Restrito',
            description: 'Você precisa estar logado para acessar esta página',
            variant: 'destructive',
          });
        }
      } else if (!isAdmin && !(allowBarber && isBarber)) {
        if (location.pathname !== '/auth' && location.pathname !== '/') {
          console.log('AdminRoute: Access denied');
          toast({
            title: 'Acesso Restrito',
            description: 'Você não tem permissão para acessar o painel administrativo',
            variant: 'destructive',
          });
        }
      }
    }
  }, [loading, user, isAdmin, isBarber, allowBarber, toast, location.pathname]);
  
  if (loading) {
    console.log('AdminRoute: loading...');
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  if (isAdmin) {
    return <>{children}</>;
  }
  
  if (allowBarber && isBarber) {
    return <>{children}</>;
  }
  
  return <Navigate to="/" replace />;
};

export default AdminRoute;
