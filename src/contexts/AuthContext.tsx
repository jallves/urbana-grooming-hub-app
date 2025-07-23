
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AppRole = 'admin' | 'user' | 'barber';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isBarber: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isBarber, setIsBarber] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCheckedRoles, setHasCheckedRoles] = useState<boolean>(false);

  const checkUserRole = useCallback(async (userId: string, userEmail: string) => {
    if (!userId || !userEmail || hasCheckedRoles) {
      return;
    }
    
    console.log('Checking roles for user:', userId, userEmail);
    
    try {
      // Check user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) {
        console.error('Error checking user roles:', rolesError);
        return;
      }
      
      const roleArray = roles?.map(r => r.role) || [];
      const hasAdminRole = roleArray.includes('admin');
      const hasBarberRole = roleArray.includes('barber');
      
      console.log('User roles found:', roleArray);
      
      // Update roles
      setIsAdmin(hasAdminRole);
      setIsBarber(hasBarberRole);
      setHasCheckedRoles(true);
      
      console.log('Final role assignment:', { hasAdminRole, hasBarberRole });
      
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      setIsAdmin(false);
      setIsBarber(false);
      setHasCheckedRoles(true);
    }
  }, [hasCheckedRoles]);

  const signOut = useCallback(async () => {
    console.log('Starting logout');
    try {
      // Clear state first
      setIsAdmin(false);
      setIsBarber(false);
      setUser(null);
      setSession(null);
      setHasCheckedRoles(false);
      
      // Then sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      } else {
        console.log('Logout completed successfully');
        // Redirect to homepage after successful logout
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  // Initialize auth and set up listener
  useEffect(() => {
    console.log('AuthProvider initialized');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth event:', event, 'Session:', newSession?.user?.email);
            
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (newSession?.user && event !== 'SIGNED_OUT') {
              // Reset role check flag when new session starts
              setHasCheckedRoles(false);
            } else {
              // Clear roles on sign out
              setIsAdmin(false);
              setIsBarber(false);
              setHasCheckedRoles(false);
            }
          }
        );

        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Critical error in AuthProvider:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array to run only once

  // Separate useEffect for checking roles
  useEffect(() => {
    if (user && !hasCheckedRoles && !loading) {
      checkUserRole(user.id, user.email || '');
    }
  }, [user, hasCheckedRoles, loading, checkUserRole]);

  const contextValue = {
    session,
    user,
    isAdmin,
    isBarber,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
