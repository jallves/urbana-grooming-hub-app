
import React, { useEffect } from 'react';
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
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gray-50">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-gray-700 mb-4" />
        <p className="text-gray-600 text-base sm:text-lg font-medium">
          Verificando permissões...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const hasAccess = isAdmin || (allowBarber && isBarber);

  // Use useEffect to show toast to avoid calling setState during render
  useEffect(() => {
    if (user && !hasAccess) {
      toast({
        title: 'Acesso Restrito',
        description: 'Você não tem permissão para acessar esta área',
        variant: 'destructive',
      });
    }
  }, [user, hasAccess, toast]);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
