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
  const [checkingRole, setCheckingRole] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Only run this once on initial component mount
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      
      if (loading) {
        return; // Wait for auth to complete
      }
      
      if (!user) {
        console.log('BarberRoute - No user, will redirect to login');
        setHasAccess(false);
        return;
      }
      
      // Admin or known barber can access
      if (isAdmin || isBarber) {
        console.log('BarberRoute - User is barber or admin, granting access');
        setHasAccess(true);
        return;
      }
      
      // Special check for email
      if (user.email === 'jhoaoallves84@gmail.com') {
        console.log('BarberRoute - Special user detected, granting access');
        setHasAccess(true);
        return;
      }
      
      // Otherwise, need to check barber role
      setCheckingRole(true);
      
      const checkBarberRole = async () => {
        try {
          console.log('BarberRoute - Checking barber role for:', user.email);
          
          // Check if the user has a barber role in user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .eq('role', 'barber');
          
          if (roleError) {
            console.error('BarberRoute - Error checking barber role:', roleError);
            setHasAccess(false);
          } else {
            const hasBarberRole = roleData && roleData.length > 0;
            console.log('BarberRoute - Has barber role:', hasBarberRole);
            setHasAccess(hasBarberRole);
          }
        } catch (error) {
          console.error('BarberRoute - Error in barber role check:', error);
          setHasAccess(false);
        } finally {
          setCheckingRole(false);
        }
      };

      setTimeout(() => {
        checkBarberRole();
      }, 0);
    }
  }, [user, loading, isAdmin, isBarber, initialCheckDone]);

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
