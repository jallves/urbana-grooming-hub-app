
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

    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Auth event:', event);
          
          if (!isMounted) return;
          
          // Synchronous updates first
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // If user changes, check role
          if (newSession?.user) {
            console.log('New session, checking user role:', newSession.user.email);
            
            // Use setTimeout to avoid potential deadlocks with Supabase client
            setTimeout(() => {
              if (isMounted) {
                checkUserRole(newSession.user.id, newSession.user.email || '').catch(err => {
                  console.error('Error checking user role via timeout:', err);
                });
              }
            }, 0);
          } else {
            console.log('Session ended or invalid');
            if (isMounted) {
              setIsAdmin(false);
              setIsBarber(false);
            }
          }
        }
      );

      // THEN check for existing session
      const getSession = async () => {
        try {
          console.log('Getting current session');
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (!isMounted) return;
          
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            console.log('Session found, checking user role:', currentSession.user.email);
            await checkUserRole(currentSession.user.id, currentSession.user.email || '');
          } else {
            console.log('No session found');
            setIsAdmin(false);
            setIsBarber(false);
          }
        } catch (error) {
          console.error('Error getting session:', error);
        } finally {
          if (isMounted) {
            console.log('Loading complete');
            setLoading(false);
          }
        }
      };

      getSession();

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Critical error in AuthProvider:', error);
      if (isMounted) {
        setLoading(false);
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsBarber(false);
      }
    }
  }, []);

  // STRICT role checking: user must have barber role AND be active staff member
  const checkUserRole = async (userId: string, userEmail: string) => {
    try {
      console.log('STRICT role check for user:', userId, userEmail);
      
      // Reset roles first
      setIsAdmin(false);
      setIsBarber(false);
      
      // Check if we have userId before querying
      if (!userId) {
        console.log('userId is empty, cannot check roles');
        return;
      }
      
      // STEP 1: Check if user is an active staff member FIRST (most important check)
      console.log('Checking if user is active staff member...');
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

      let isActiveBarber = false;
      
      if (staffMember) {
        console.log('✅ User is confirmed as active staff member:', staffMember);
        
        // STEP 2: Only if user is active staff, check for barber role
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);
        
        if (rolesError) {
          console.error('Error checking user role:', rolesError);
          return;
        }
        
        console.log('User roles from database:', roles);
        
        // Check for admin role
        const hasAdminRole = roles?.some(role => role.role === 'admin');
        
        // Check for barber role (only matters if user is active staff)
        const hasBarberRole = roles?.some(role => role.role === 'barber');
        
        if (hasBarberRole) {
          console.log('✅ User has barber role AND is active staff - ACCESS GRANTED');
          isActiveBarber = true;
        } else {
          console.log('❌ User is active staff but does NOT have barber role in user_roles table');
        }
        
        console.log('Final role determination:', {
          email: userEmail,
          hasAdminRole,
          hasBarberRole,
          isActiveStaff: true,
          finalIsAdmin: hasAdminRole,
          finalIsBarber: isActiveBarber
        });
        
        setIsAdmin(hasAdminRole || false);
        setIsBarber(isActiveBarber);
      } else {
        console.log('❌ User is NOT an active staff member - NO BARBER ACCESS');
        
        // Still check for admin role even if not staff
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);
        
        if (!rolesError && roles) {
          const hasAdminRole = roles?.some(role => role.role === 'admin');
          setIsAdmin(hasAdminRole || false);
          console.log('User admin status:', hasAdminRole);
        }
        
        setIsBarber(false); // Definitely not a barber if not active staff
      }
      
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      setIsAdmin(false);
      setIsBarber(false);
    }
  };

  const signOut = async () => {
    console.log('Starting logout');
    try {
      await supabase.auth.signOut();
      console.log('Logout completed');
      setIsAdmin(false);
      setIsBarber(false);
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
