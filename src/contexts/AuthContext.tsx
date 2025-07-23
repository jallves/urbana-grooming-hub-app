
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

  const signOut = useCallback(async () => {
    console.log('Starting logout process');
    try {
      setIsAdmin(false);
      setIsBarber(false);
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      }
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/';
    }
  }, []);

  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      console.log('Checking roles for user:', userId);
      
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking user roles:', error);
        setIsAdmin(false);
        setIsBarber(false);
        return;
      }
      
      const roleArray = roles?.map(r => r.role) || [];
      const hasAdminRole = roleArray.includes('admin');
      const hasBarberRole = roleArray.includes('barber');
      
      console.log('User roles found:', roleArray);
      
      setIsAdmin(hasAdminRole);
      setIsBarber(hasBarberRole);
    } catch (error) {
      console.error('Error in checkUserRoles:', error);
      setIsAdmin(false);
      setIsBarber(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider initializing');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session:', initialSession?.user?.email || 'No user');
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await checkUserRoles(initialSession.user.id);
        } else {
          setIsAdmin(false);
          setIsBarber(false);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event, 'Session:', newSession?.user?.email || 'No user');
        
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT' || !newSession?.user) {
          setIsAdmin(false);
          setIsBarber(false);
        } else if (event === 'SIGNED_IN' && newSession?.user) {
          await checkUserRoles(newSession.user.id);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserRoles]);

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
