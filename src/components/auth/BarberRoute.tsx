
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BarberRouteProps {
  children: React.ReactNode;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const [isBarber, setIsBarber] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkBarberRole = async () => {
      if (!user) {
        console.log('BarberRoute - No user found');
        setIsBarber(false);
        setCheckingRole(false);
        return;
      }

      // Admin can access everything
      if (isAdmin) {
        console.log('BarberRoute - User is admin, granting access');
        setIsBarber(true);
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
          setIsBarber(false);
        } else {
          const hasBarberRole = roleData && roleData.length > 0;
          console.log('BarberRoute - User has barber role:', hasBarberRole);
          setIsBarber(hasBarberRole);
        }
      } catch (error) {
        console.error('BarberRoute - Error in barber role check:', error);
        toast({
          title: 'Erro de acesso',
          description: 'Ocorreu um erro ao verificar seu acesso',
          variant: 'destructive',
        });
        setIsBarber(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (!loading) {
      checkBarberRole();
    }
  }, [user, loading, isAdmin]);

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

  // If not a barber, redirect to an unauthorized page or home
  if (!isBarber) {
    console.log('BarberRoute - Not a barber, redirecting to home');
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar a área do barbeiro',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role, render the protected content
  return <>{children}</>;
};

export default BarberRoute;
