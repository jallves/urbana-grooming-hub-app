
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Use ref to track if roles have been checked to prevent infinite loops
  const rolesChecked = useRef<boolean>(false);
  const currentUserId = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    console.log('Starting logout process');
    try {
      // Clear state immediately
      setIsAdmin(false);
      setIsBarber(false);
      setUser(null);
      setSession(null);
      rolesChecked.current = false;
      currentUserId.current = null;
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      } else {
        console.log('Logout completed successfully');
        // Force redirect to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  }, []);

  // Memoized role checking function
  const checkUserRoles = useCallback(async (userId: string) => {
    // Prevent duplicate checks for the same user
    if (rolesChecked.current && currentUserId.current === userId) {
      console.log('Roles already checked for user:', userId);
      return;
    }
    
    console.log('Checking roles for user:', userId);
    rolesChecked.current = true;
    currentUserId.current = userId;
    
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking user roles:', error);
        setIsAdmin(false);
        setIsBarber(false);
      } else {
        const roleArray = roles?.map(r => r.role) || [];
        const hasAdminRole = roleArray.includes('admin');
        const hasBarberRole = roleArray.includes('barber');
        
        console.log('User roles found:', roleArray);
        console.log('Setting roles - Admin:', hasAdminRole, 'Barber:', hasBarberRole);
        
        setIsAdmin(hasAdminRole);
        setIsBarber(hasBarberRole);
      }
    } catch (error) {
      console.error('Error in checkUserRoles:', error);
      setIsAdmin(false);
      setIsBarber(false);
    }
  }, []);

  // Initialize auth and set up listener
  useEffect(() => {
    console.log('AuthProvider initializing');
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
        
        // Reset role check flags when session changes
        if (!initialSession?.user) {
          rolesChecked.current = false;
          currentUserId.current = null;
          setIsAdmin(false);
          setIsBarber(false);
        }
        
        setLoading(false);

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth event:', event, 'Session:', newSession?.user?.email);
            
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (event === 'SIGNED_OUT' || !newSession?.user) {
              // Clear roles on sign out
              setIsAdmin(false);
              setIsBarber(false);
              rolesChecked.current = false;
              currentUserId.current = null;
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              // Reset roles check for new session
              if (currentUserId.current !== newSession.user.id) {
                rolesChecked.current = false;
                currentUserId.current = null;
              }
            }
            
            setLoading(false);
          }
        );

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
  }, []);

  // Check roles when user changes (but only once per user)
  useEffect(() => {
    if (user?.id && !loading && !rolesChecked.current) {
      console.log('Triggering role check for user:', user.email);
      checkUserRoles(user.id);
    }
  }, [user?.id, loading, checkUserRoles]);

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
