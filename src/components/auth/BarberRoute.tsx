
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
  const [checkingRole, setCheckingRole] = useState(loading);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only check roles if we're not already loading auth state
    // and we have a user
    if (!loading && user) {
      const checkBarberRole = async () => {
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
          }
        } catch (error) {
          console.error('BarberRoute - Error in barber role check:', error);
          setHasAccess(false);
          
          toast({
            title: 'Erro de acesso',
            description: 'Ocorreu um erro ao verificar seu acesso',
            variant: 'destructive',
          });
        } finally {
          setCheckingRole(false);
        }
      };

      checkBarberRole();
    } else if (!loading && !user) {
      // If not loading and no user, they don't have access
      setHasAccess(false);
      setCheckingRole(false);
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
    console.log('BarberRoute - No user, redirecting to login');
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasAccess) {
    // Show toast and redirect to home if not a barber
    console.log('BarberRoute - User does not have barber role, redirecting to home');
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta área',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role, render the protected content
  console.log('BarberRoute - Access granted to barber route');
  return <>{children}</>;
};

export default BarberRoute;
