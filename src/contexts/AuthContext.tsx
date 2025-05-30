
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  const [isCheckingRoles, setIsCheckingRoles] = useState<boolean>(false);

  const checkUserRole = useCallback(async (userId: string, userEmail: string) => {
    if (isCheckingRoles) return; // Prevent concurrent role checks
    
    setIsCheckingRoles(true);
    console.log('Checking roles for user:', userId, userEmail);
    
    try {
      // Reset roles first
      setIsAdmin(false);
      setIsBarber(false);
      
      if (!userId || !userEmail) {
        console.log('No userId or email provided');
        return;
      }
      
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
      
      // For barber role, also check staff status
      let isActiveBarber = false;
      if (hasBarberRole) {
        const { data: staffMember, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', userEmail)
          .eq('is_active', true)
          .maybeSingle();
          
        if (staffError) {
          console.error('Error checking staff member:', staffError);
        }
        
        isActiveBarber = !!staffMember;
        console.log('Staff check result:', { hasBarberRole, isActiveStaff: !!staffMember });
      }
      
      // Update roles in a single batch
      setIsAdmin(hasAdminRole);
      setIsBarber(isActiveBarber);
      
      console.log('Final role assignment:', { hasAdminRole, isActiveBarber });
      
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      setIsAdmin(false);
      setIsBarber(false);
    } finally {
      setIsCheckingRoles(false);
    }
  }, [isCheckingRoles]);

  const signOut = useCallback(async () => {
    console.log('Starting logout');
    try {
      // Clear state first
      setIsAdmin(false);
      setIsBarber(false);
      setUser(null);
      setSession(null);
      
      // Then sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      } else {
        console.log('Logout completed successfully');
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
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        // Check roles for initial session
        if (initialSession?.user) {
          await checkUserRole(initialSession.user.id, initialSession.user.email || '');
        }
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth event:', event, 'Session:', newSession?.user?.email);
            
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (newSession?.user && event !== 'SIGNED_OUT') {
              // Check roles for new session
              await checkUserRole(newSession.user.id, newSession.user.email || '');
            } else {
              // Clear roles on sign out
              setIsAdmin(false);
              setIsBarber(false);
            }
          }
        );

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Critical error in AuthProvider:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

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
