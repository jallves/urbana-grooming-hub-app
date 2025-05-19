
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
                checkUserRole(newSession.user.id).catch(err => {
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
            await checkUserRole(currentSession.user.id);
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

  // Check if user has admin or barber role
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking roles for user:', userId);
      
      // Check if we have userId before querying
      if (!userId) {
        console.log('userId is empty, cannot check roles');
        setIsAdmin(false);
        setIsBarber(false);
        return;
      }
      
      // Special check for specific emails
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user?.email === 'joao.colimoides@gmail.com' || 
          userData?.user?.email === 'jhoaoallves84@gmail.com') {
        console.log('Special user detected, setting appropriate access:', userData.user.email);
        
        if (userData?.user?.email === 'joao.colimoides@gmail.com') {
          setIsAdmin(true);
          setIsBarber(false);
        } else if (userData?.user?.email === 'jhoaoallves84@gmail.com') {
          setIsAdmin(false);
          setIsBarber(true);
        }
        
        return;
      }
      
      // Regular role check for other users
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsBarber(false);
        return;
      }
      
      console.log('User roles:', roles);
      
      // Check for admin or barber role
      const hasAdminRole = roles?.some(role => role.role === 'admin');
      const hasBarberRole = roles?.some(role => role.role === 'barber');
      
      console.log('User is admin:', hasAdminRole, 'Is barber:', hasBarberRole);
      
      setIsAdmin(hasAdminRole);
      setIsBarber(hasBarberRole);
    } catch (error) {
      console.error('Error checking user role:', error);
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
