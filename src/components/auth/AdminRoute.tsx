import React, { useRef } from 'react';
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
  allowedRoles = []
}) => {
  const { user, isAdmin, isBarber, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const toastShown = useRef(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!user) {
    if (!toastShown.current) {
      toast({
        title: 'Acesso Restrito',
        description: 'Você precisa estar logado para acessar esta página',
        variant: 'destructive',
      });
      toastShown.current = true;
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificação de roles se aplicável
  const userRole = isAdmin ? 'admin' : isBarber ? 'barber' : 'client';
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (!toastShown.current) {
      toast({
        title: 'Acesso Negado',
        description: 'Seu perfil não tem permissão para acessar esta área',
        variant: 'destructive',
      });
      toastShown.current = true;
    }
    return <Navigate to="/" replace />;
  }

  // Caso padrão: Admin ou Barbeiro permitido
  if (!isAdmin && !(allowBarber && isBarber)) {
    if (!toastShown.current) {
      toast({
        title: 'Acesso Restrito',
        description: 'Você não tem permissão para acessar esta área',
        variant: 'destructive',
      });
      toastShown.current = true;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
