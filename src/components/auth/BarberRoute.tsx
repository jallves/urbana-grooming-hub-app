
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BarberRouteProps {
  children: React.ReactNode;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isBarber, setIsBarber] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkBarberRole = async () => {
      if (!user) {
        setIsBarber(false);
        setCheckingRole(false);
        return;
      }

      try {
        // Check if the user has a barber role
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'barber');
        
        if (error) {
          console.error('Error checking barber role:', error);
          setIsBarber(false);
        } else {
          setIsBarber(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error in barber role check:', error);
        setIsBarber(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (!loading) {
      checkBarberRole();
    }
  }, [user, loading]);

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
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // If not a barber, redirect to an unauthorized page or home
  if (!isBarber) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and has barber role, render the protected content
  return <>{children}</>;
};

export default BarberRoute;
