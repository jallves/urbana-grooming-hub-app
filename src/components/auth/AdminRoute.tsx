import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
  allowedRoles?: string[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = false, 
}) => {
  const { user, isAdmin, isBarber, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!user) {
    toast({
      title: 'Acesso Restrito',
      description: 'Você precisa estar logado para acessar esta página',
      variant: 'destructive',
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin && !(allowBarber && isBarber)) {
    toast({
      title: 'Acesso Restrito',
      description: 'Você não tem permissão para acessar esta área',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;