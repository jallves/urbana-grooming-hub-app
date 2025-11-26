
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isMaster: boolean;
  isManager: boolean;
  userRole: 'master' | 'admin' | 'manager' | 'barber' | null;
  rolesChecked: boolean;
  requiresPasswordChange: boolean;
  canAccessModule: (moduleName: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Versão simplificada - sem cache

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarber, setIsBarber] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userRole, setUserRole] = useState<'master' | 'admin' | 'manager' | 'barber' | null>(null);
  const [rolesChecked, setRolesChecked] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const applyRole = (role: 'master' | 'admin' | 'manager' | 'barber' | null) => {
    setUserRole(role);
    setIsMaster(role === 'master');
    setIsAdmin(role === 'admin' || role === 'master');
    setIsManager(role === 'manager');
    setIsBarber(role === 'barber');
    setRolesChecked(true);
  };

  const checkUserRoles = async (user: User): Promise<'master' | 'admin' | 'manager' | 'barber' | null> => {
    if (!user) {
      applyRole(null);
      setLoading(false);
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        applyRole(null);
        setLoading(false);
        return null;
      }

      const role = data.role as 'master' | 'admin' | 'manager' | 'barber';
      applyRole(role);
      setLoading(false);
      return role;

    } catch (error) {
      applyRole(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await checkUserRoles(session.user);
      } else {
        setLoading(false);
        setRolesChecked(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          applyRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            await checkUserRoles(session.user);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsAdmin(false);
    setIsBarber(false);
    setIsMaster(false);
    setIsManager(false);
    setUserRole(null);
    setUser(null);
    setRolesChecked(true);
    
    await supabase.auth.signOut();
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (!rolesChecked || !userRole) return false;
    if (userRole === 'master') return true;
    if (userRole === 'admin') return moduleName !== 'configuracoes';
    if (userRole === 'manager') return moduleName !== 'financeiro' && moduleName !== 'configuracoes';
    return false;
  };

  const value = {
    user,
    loading,
    isAdmin,
    isBarber,
    isMaster,
    isManager,
    userRole,
    rolesChecked,
    requiresPasswordChange,
    canAccessModule,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider as default };
