
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BarberRouteProps {
  children: React.ReactNode;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ children }) => {
  const { user, loading, isAdmin, isBarber } = useAuth();
  const location = useLocation();
  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkBarberRole = async () => {
      if (!user) {
        console.log('BarberRoute - No user found');
        setCheckingRole(false);
        return;
      }

      try {
        // Admin can access everything
        if (isAdmin) {
          console.log('BarberRoute - User is admin, granting access');
          setHasAccess(true);
          setCheckingRole(false);
          return;
        }
        
        // If barber flag is already set in context, use it
        if (isBarber) {
          console.log('BarberRoute - User is known barber, granting access');
          setHasAccess(true);
          setCheckingRole(false);
          return;
        }

        console.log('BarberRoute - Checking barber role for user:', user.id);
        
        // Check if the user has a barber role in user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'barber');
        
        if (roleError) {
          console.error('BarberRoute - Error checking barber role:', roleError);
          setCheckingRole(false);
          setHasAccess(false);
          
          toast({
            title: 'Erro de verificação',
            description: 'Não foi possível verificar suas permissões',
            variant: 'destructive',
          });
        } else {
          const hasBarberRole = roleData && roleData.length > 0;
          console.log('BarberRoute - User has barber role:', hasBarberRole);
          setHasAccess(hasBarberRole);
          setCheckingRole(false);
        }
      } catch (error) {
        console.error('BarberRoute - Error in barber role check:', error);
        setCheckingRole(false);
        setHasAccess(false);
        
        toast({
          title: 'Erro de acesso',
          description: 'Ocorreu um erro ao verificar seu acesso',
          variant: 'destructive',
        });
      }
    };

    if (!loading) {
      checkBarberRole();
    }
  }, [user, loading, isAdmin, isBarber, toast]);

  // Show loading spinner while checking authentication or role
  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasAccess) {
    // Show toast and redirect to home if not a barber
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta área',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role, render the protected content
  return <>{children}</>;
};

export default BarberRoute;
