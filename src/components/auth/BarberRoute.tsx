
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
  const { toast } = useToast();

  useEffect(() => {
    const checkBarberRole = async () => {
      if (!user) {
        console.log('BarberRoute - No user found');
        setCheckingRole(false);
        return;
      }

      // Admin can access everything
      if (isAdmin) {
        console.log('BarberRoute - User is admin, granting access');
        setCheckingRole(false);
        return;
      }
      
      // If barber flag is already set in context, use it
      if (isBarber) {
        console.log('BarberRoute - User is known barber, granting access');
        setCheckingRole(false);
        return;
      }

      try {
        console.log('BarberRoute - Checking barber role for user:', user.id);
        
        // Check if the user has a barber role in user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'barber');
        
        if (roleError) {
          console.error('BarberRoute - Error checking barber role:', roleError);
          toast({
            title: 'Erro de verificação',
            description: 'Não foi possível verificar suas permissões',
            variant: 'destructive',
          });
          setCheckingRole(false);
        } else {
          const hasBarberRole = roleData && roleData.length > 0;
          console.log('BarberRoute - User has barber role:', hasBarberRole);
          setCheckingRole(false);
        }
      } catch (error) {
        console.error('BarberRoute - Error in barber role check:', error);
        toast({
          title: 'Erro de acesso',
          description: 'Ocorreu um erro ao verificar seu acesso',
          variant: 'destructive',
        });
        setCheckingRole(false);
      }
    };

    if (!loading) {
      checkBarberRole();
    }
  }, [user, loading, isAdmin, isBarber, toast]);

  // Show loading while checking authentication or role
  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('BarberRoute - Not authenticated, redirecting to login');
    toast({
      title: 'Acesso Negado',
      description: 'Você precisa fazer login para acessar esta página',
    });
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // If not a barber or admin, redirect to an unauthorized page or home
  if (!isBarber && !isAdmin) {
    console.log('BarberRoute - Not a barber or admin, redirecting to home');
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar a área do barbeiro',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role or is admin, render the protected content
  return <>{children}</>;
};

export default BarberRoute;
