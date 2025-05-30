
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    console.log('AuthProvider initialized');
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth event:', event, 'Session:', newSession?.user?.email);
            
            if (!isMounted) return;
            
            // Update state synchronously first
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            // Handle role checking after state updates
            if (newSession?.user && event !== 'SIGNED_OUT') {
              // Use setTimeout to prevent deadlocks
              setTimeout(() => {
                if (isMounted) {
                  checkUserRole(newSession.user.id, newSession.user.email || '');
                }
              }, 100);
            } else {
              // Clear roles immediately on sign out
              if (isMounted) {
                setIsAdmin(false);
                setIsBarber(false);
              }
            }
          }
        );

        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (!isMounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await checkUserRole(initialSession.user.id, initialSession.user.email || '');
        }

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Critical error in AuthProvider:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const checkUserRole = async (userId: string, userEmail: string) => {
    try {
      console.log('Checking roles for user:', userId, userEmail);
      
      // Reset roles first
      setIsAdmin(false);
      setIsBarber(false);
      
      if (!userId) {
        console.log('No userId provided');
        return;
      }
      
      // Check staff status first
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();
        
      if (staffError) {
        console.error('Error checking staff member:', staffError);
        return;
      }

      // Check user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (rolesError) {
        console.error('Error checking user roles:', rolesError);
        return;
      }
      
      console.log('User roles:', roles);
      
      const hasAdminRole = roles?.some(role => role.role === 'admin') || false;
      const hasBarberRole = roles?.some(role => role.role === 'barber') || false;
      
      // Only set barber role if user is also active staff
      const isActiveBarber = hasBarberRole && !!staffMember;
      
      console.log('Role check result:', {
        hasAdminRole,
        hasBarberRole,
        isActiveStaff: !!staffMember,
        finalIsBarber: isActiveBarber
      });
      
      setIsAdmin(hasAdminRole);
      setIsBarber(isActiveBarber);
      
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      setIsAdmin(false);
      setIsBarber(false);
    }
  };

  const signOut = async () => {
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
  };

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
