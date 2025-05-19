
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
      
      // Special check for email - FIXED to use exact match
      if (user.email === 'jhoaoallves84@gmail.com') {
        console.log('BarberRoute - Special user detected, granting access');
        setHasAccess(true);
        return;
      }
    }
  }, [user, loading, isAdmin, isBarber, initialCheckDone]);

  // Show loading spinner while checking authentication
  if (loading) {
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

  if (!hasAccess && !isBarber) {
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
